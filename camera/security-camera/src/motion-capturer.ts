/**
 * Watch the new cam image folder for new images and upload to S3 if motion is detected.
 * TODO: upload file
 * TODO: docs!
 * TODO: A debug mode with lots-o-logs may be helpful. Currently just logging errors which will show up in balena.io.
 * TODO: This iteration is great when there's a good internet connection. Consider adding offline mode that also handles 
 * power outages/resets e.g. log upload stack to file that gets read at startup?
 */

import { MotionCapturerOptions } from './model/motion-capturer-options';
import { HotspotBoundingBox } from './model/hotspot-bounding-box';
import { get } from 'lodash';
import { watch } from 'chokidar';
import Jimp from 'jimp';
import { FileStack } from './file-stack';
import { HotspotUtils } from './util/hotspot-utils';
import { JimpUtils } from './util/jimp-utils';
import { CmdUtils } from './util/cmd-utils';

export class MotionCapturer {
  
  // Provided options via constructor parameter
  protected readonly options: MotionCapturerOptions;
  
  // Default fallback options
  protected defaultOptions: MotionCapturerOptions = {
    dataUploader: null,
    tempImageDirectory: '/image-temp',
    readyImageDirectory: '/image-ready',
    motionSensitivity: 20.0,
    motionHotspots: '0,0,100,100',
    dbRecordTtl: 30,
    thumbWidth: 20,
    thumbHeight: 16
  }

  // Used for image comparisons (motion detection) via Jimp's hash method
  protected previousThumb: Jimp;

  // Stack new image paths for processing as able.
  protected newImageStack = new FileStack();
  protected newImageBusy = false;

  // Stack images ready for upload as able.
  protected uploadImageStack = new FileStack();
  protected uploadImageBusy: false;

  // Sub-boxes of a thumbnail where motion will be detected, ignoring areas outside those boxes.
  protected motionHotspots: HotspotBoundingBox[];
  
  constructor(options: MotionCapturerOptions) {
    // Set options based on input or defaults if not provided.
    this.options = {
      dataUploader: get(options, 'dataUploader', null),
      tempImageDirectory: get(options, 'tempImageDirectory', this.defaultOptions.tempImageDirectory),
      readyImageDirectory: get(options, 'readyImageDirectory', this.defaultOptions.readyImageDirectory),
      motionSensitivity: get(options, 'motionSensitivity', this.defaultOptions.motionSensitivity),
      motionHotspots: get(options, 'motionHotspots', ''),
      dbRecordTtl: get(options, 'dbRecordTtl', this.defaultOptions.dbRecordTtl),
      thumbWidth: get(options, 'thumbWidth', this.defaultOptions.thumbWidth),
      thumbHeight: get(options, 'thumbHeight', this.defaultOptions.thumbHeight)
    };

    // Proceed no further if AWS options are not set properly.
    if (!this.options.dataUploader) {
      throw new Error('MotionCapturer constructor: DataUploader is required.');
    }

    // Initial thumb to compare against, first image processed will be captured when compared with this.
    this.previousThumb = new Jimp(this.options.thumbWidth, this.options.thumbHeight, 0xFF0000FF);

    // Set hotspots for detecting motion in cam image thumbnails.
    this.motionHotspots = this.convertMotionHotspots(this.options.motionHotspots);
  }

  /**
   * Get the file name for a given full path.
   * @param filePath - Full path to the file.
   */
  protected getFileName = (filePath: string): string => {
    const pathSplit = filePath.split('/');
    return pathSplit[pathSplit.length - 1];
  }

  /**
   * Move qualified image file to persistent upload directory so that it doesn't get cleared automatically
   * by raspistill-manager after X seconds.
   * @param 
   */
  protected saveFileForUpload = async (filePath: string, destinationDir: string): Promise<string> => {
    const fileName = this.getFileName(filePath);
    const movedFilePath = `${destinationDir}/${fileName}`;
    try {
      await CmdUtils.moveFile(filePath, movedFilePath);
      return movedFilePath;
    } catch (err) {
      console.error('moveFile error', err.message);
      throw new Error(`Unable to move file ${fileName} to ${movedFilePath}`);
    }
  }

  /**
   * Watch the image directory for file changes.
   */
  protected watchCamImages = (): void => {
    const watcher = watch(this.options.tempImageDirectory, {
      ignored: /preview|\~/,
      usePolling: true,
      interval: 200
    });
    
    // Add newly added camera images to the stack for processing and process if not busy.
    watcher.on('add', (path: string) => {
      console.log(`File ${path} has been added`);
      this.newImageStack.push(path);
      this.processImageUploadStack();
    });

    // When images are auto-deleted by raspistill-manager after a given time, ensure it doesn't exist in the
    // stack so that it doesn't get processed. For example, maybe the camera is taking pictures faster than
    // can be processed (not likely, yet play it safe).
    watcher.on('unlink', (path: string) => {
      // console.log(`File ${path} has been removed`);
      this.newImageStack.cancel(path);
    });
  }

  /**
   * Prep args for exiv2 command that will extract embedded thumbnail as file.
   * Extracting the embedded thumbnail then loading that file seems faster than
   * other methods so far for a Pi that has fewer resources.
   * TODO: Continue to explore more elegant options for JS reading?
   * @param imagePath - Full path to the large image that will have its embedded thumbnail extracted.
   * @param tempImageDir - Directory where the thumb will be saved temporarily.
   * Returns thumbnail image path.
   */
  protected extractThumbnailAsFile = async (imagePath: string, tempImageDir: string): Promise<string> => {
    const fileName = this.getFileName(imagePath);
    // exiv2 is going to name from [original].jpg to [original]-preview1.jpg
    const fileNameSplit = fileName.split('.');
    const thumbFileName = `${fileNameSplit[0]}-preview1.${fileNameSplit[1]}`;

    // Execute command
    try {
      await CmdUtils.spawnAsPromise('exiv2', ['-ep1', '-l', tempImageDir, imagePath]);
      return `${tempImageDir}/${thumbFileName}`;
    } catch (err) {
      console.error('extractThumbnailAsFile error', err.message);
      throw new Error('Unable to extract thumbnail as file');
    }
  }

  /**
   * Look for a significant pixel change between thumbnails within motion hotspots as a means to detect motion.
   * @param newThumb - Newly extracted camera image thumbnail for comparison
   * @param prevThumb - Previously saved camera image thumbnail for comparison
   * @param hotspots - Array of hotspots describing subsets of pixels within in image to check for motion
   * @param motionSensitivity - Pixel value percentage threshold between new/previous thumbnail that determines motion happened
   * returns true if motion was detected, false otherwise.
   */
  protected detectMotion = (newThumb: Jimp, prevThumb: Jimp, hotspots: HotspotBoundingBox[], motionSensitivity: number): boolean => {
    // Return true on the first pixel that crosses the motion sensitivity threshold.
    for (const hotspot of hotspots) {
      for (const x of [...Array(hotspot.width).keys()]){
        for (const y of [...Array(hotspot.height).keys()]) {
          const rgbDistanceRatio = JimpUtils.getPixelRgbDistanceRatio(prevThumb, newThumb, x + hotspot.left, y + hotspot.top);

          if (rgbDistanceRatio * 100 >= motionSensitivity) {
            // Detected motion! Iterate no further.
            return true;
          }
        }
      }
    };

    // No motion was detected.
    return false;
  }

  /**
   * Get the thumbnail for an image
   */
  protected getThumbnail = async (imagePath: string): Promise<Jimp> => {
     // Get the image thumbnail for comparison with previous thumbnail when detecting motion
     const thumbPath = await this.extractThumbnailAsFile(imagePath, this.options.tempImageDirectory);
     const newThumb = await JimpUtils.loadImage(thumbPath);
     return newThumb;
  }

  /**
   * Process the new cam image stack one item at a time as available.
   */
  protected processNewImageStack = async (): Promise<void> => {
    if (this.newImageBusy === false && !this.newImageStack.isEmpty()) {
      // Don't process other stack items until this one is finished.
      this.newImageBusy = true;

      // Take the top/last item in the stack.
      const stackImage = this.newImageStack.pop();

      try {
        // Get the thumbnail for the new image
        const newThumb = await this.getThumbnail(stackImage);
        
        // Detect motion.
        const motionDetected = this.detectMotion(newThumb, this.previousThumb, this.motionHotspots, this.options.motionSensitivity);

        // Upload image if motion was detected.
        if (motionDetected) {
          const movedImage = await this.saveFileForUpload(stackImage, this.options.readyImageDirectory);
          this.uploadImageStack.push(movedImage);
          this.previousThumb = newThumb;
        }
      } catch (err) {
        console.error('processNewImageStack error', err.message);
      }

      // All done, open for next item in the stack
      this.newImageBusy = false;
    }
    return;
  }

  protected processImageUploadStack = (): void => {
    // TODO
  }

  /**
   * Parse environment variable hotspot string into an array of hotspots/boxes where motion will be detected.
   */
  protected convertMotionHotspots = (hotspotString: string): HotspotBoundingBox[] => {
    const hotspots = HotspotUtils.getHotspotsFromString(this.options.motionHotspots, this.options.thumbWidth, this.options.thumbHeight);
    if (hotspots.length > 0) {
      return hotspots;
    }

    // Add default hotspot(s) if provided value(s) were invalid.
    return HotspotUtils.getHotspotsFromString(this.defaultOptions.motionHotspots, this.options.thumbWidth, this.options.thumbHeight);
  }

  /**
   * Get things running.
   */
  public run = (): void => {
    // Watch for new camera images and add them to the stack to be processed.
    this.watchCamImages();

    // Process the cam image stack one item at a time as not busy.
    // processNewImageStack() also gets triggered with completion of the previous stack item.
    // This serves for catching up when/if the camera is taking photos with motion faster
    // than being processed. Note, this hasn't been experienced (yet), however this is the
    // reason this service uses a stack and not a queue.
    setInterval(this.processNewImageStack, 500);

    // Process the image upload stack
    setInterval(this.processImageUploadStack, 500);
  }
}
