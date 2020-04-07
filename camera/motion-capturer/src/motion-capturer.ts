/**
 * Watch the new cam image folder for new images and upload to S3 if motion is detected.
 * TODO: AWS test
 * TODO: upload file
 * TODO: docs!
 * TODO: tests
 * TODO: A debug mode with lots-o-logs may be helpful. Currently just logging errors which will show up in balena.io.
 * TODO: This iteration is great when there's a good internet connection. Consider adding offline mode that also handles 
 * power outages/resets e.g. log upload stack to file that gets read at startup?
 */

import { MotionCapturerOptions } from './model/motion-capturer-options';
import { HotspotBoundingBox } from './model/hotspot-bounding-box';
import { get } from 'lodash';
import { watch, FSWatcher } from 'chokidar';
import { v4 as uuidv4 } from 'uuid';
import Jimp from 'jimp';
import { spawn } from 'child_process';
import mv from 'mv';
import { FileStack } from './file-stack';

export class MotionCapturer {
  
  // Provided options via constructor parameter
  private options: MotionCapturerOptions;
  
  // Default fallback options
  private defaultOptions: MotionCapturerOptions = {
    awsEndpoint: '',
    awsPrivateCert: '',
    awsRootCert: '',
    awsThingCert: '',
    tempImageDirectory: '/image-temp',
    readyImageDirectory: '/image-ready',
    motionSensitivity: 10.0,
    motionHotspots: '0,0,100,100',
    dbRecordTtl: 30
  }

  // Watch for cam image file additions.
  private camWatcher: FSWatcher;

  // Used for image comparisons (motion detection) via Jimp's hash method
  private previousThumb: Jimp;

  // Stack new image paths for processing as able.
  private newImageStack = new FileStack();
  private newImageBusy = false;

  // Stack images ready for upload as able.
  private uploadImageStack = new FileStack();
  private uploadImageBusy: false;

  // Sub-boxes of a thumbnail where motion will be detected, ignoring areas outside those boxes.
  private motionHotspots: HotspotBoundingBox[];
  
  constructor(options: MotionCapturerOptions) {
    // Set options based on input or defaults if not provided.
    this.options = {
      awsEndpoint: get(options, 'awsEndpoint', ''),
      awsPrivateCert: get(options, 'awsPrivateCert', ''),
      awsRootCert: get(options, 'awsRootCert', ''),
      awsThingCert: get(options, 'awsThingCert', ''),
      tempImageDirectory: get(options, 'tempImageDirectory', this.defaultOptions.tempImageDirectory),
      readyImageDirectory: get(options, 'readyImageDirectory', this.defaultOptions.readyImageDirectory),
      motionSensitivity: get(options, 'motionSensitivity', this.defaultOptions.motionSensitivity),
      motionHotspots: get(options, 'motionHotspots', ''),
      dbRecordTtl: get(options, 'dbRecordTtl', this.defaultOptions.dbRecordTtl),
      thumbWidth: get(options, 'thumbWidth', this.defaultOptions.thumbWidth),
      thumbHeight: get(options, 'thumbHeight', this.defaultOptions.thumbHeight)
    };

    // Proceed no further if AWS options are not set properly.
    if (this.options.awsEndpoint === '' ||
        this.options.awsPrivateCert === '' ||
        this.options.awsRootCert === '' ||
        this.options.awsThingCert === '') {
      console.error('');
      process.exit();
    }

    // Initial thumb to compare against, first image processed will be captured when compared with this.
    this.previousThumb = new Jimp(this.options.thumbWidth, this.options.thumbHeight, 0xFF0000FF);
  }

  /**
   * Get the file name for a given full path.
   * @param filePath - Full path to the file.
   */
  private getFileName = (filePath: string): string => {
    const pathSplit = filePath.split('/');
    return pathSplit[pathSplit.length - 1];
  }

  /**
   * Move qualified image file to persistent upload directory so that it doesn't get cleared automatically
   * by raspistill-manager after X seconds.
   * @param 
   */
  private moveFile = (filePath: string, destinationDir: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileName = this.getFileName(filePath);
      const movedFilePath = `${destinationDir}/${fileName}`;
      mv(filePath, movedFilePath, err => {
        if (!err) {
          resolve(movedFilePath);
        } else {
          console.error('moveFile err', err);
          reject(err);
        }
      });
    });
  }

  /**
   * Create a unique ID for each image mainly for use in filename that's tough to guess.
   */
  private makeImageId = (): string => {
    return uuidv4();
  }

  /**
   * Watch the image directory for file changes.
   */
  private watchCamImages = (): FSWatcher => {
    const watcher = watch(this.options.tempImageDirectory, {
      persistent: true,
      ignored: /preview/
    });
    
    // Add newly added camera images to the stack for processing.
    watcher.on('add', (path: string) => {
      // console.log(`File ${path} has been added`);
      this.newImageStack.push(path);
    });

    // When images are auto-deleted by raspistill-manager after a given time, ensure it doesn't exist in the
    // stack so that it doesn't get processed. For example, maybe the camera is taking pictures faster than
    // can be processed (not likely, yet play it safe).
    watcher.on('unlink', (path: string) => {
      // console.log(`File ${path} has been removed`);
      this.newImageStack.cancel(path);
    });

    return watcher;
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
  private extractThumbnailAsFile = (imagePath: string, tempImageDir: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileName = this.getFileName(imagePath);
      // exiv2 is going to name from [original].jpg to [original]-preview1.jpg
      const fileNameSplit = fileName.split('.');
      const thumbFileName = `${fileNameSplit[0]}-preview1.${fileNameSplit[1]}`;

      // Execute command
      const process = spawn('exiv2', ['-ep1', '-l', tempImageDir, imagePath]);
      process.on('close', () => {
        resolve(`${tempImageDir}/${thumbFileName}`);
      });
      process.on('exit', () => {
        resolve(`${tempImageDir}/${thumbFileName}`);
      });
      process.on('error', err => {
        console.error('extractThumbnailAsFile error', err);
        reject(err);
      });
    });
  }

  /**
   * Load a thumbnail image and return as a Jimp class image that can be used in Node.
   * @param imagePath - full path to image file
   */
  private loadThumbnail = async (thumbImagePath: string): Promise<Jimp> => {
    try {
      return await Jimp.read(thumbImagePath);
    } catch (err) {
      console.log('loadThumbnail error', err);
      return;
    }
  };

  /**
   * Look for a significant pixel change between thumbnails within motion hotspots as a means to detect motion.
   * @param newThumb - Newly extracted camera image thumbnail for comparison
   * @param prevThumb - Previously saved camera image thumbnail for comparison
   * @param hotspots - Array of hotspots describing subsets of pixels within in image to check for motion
   * @param motionSensitivity - Pixel value percentage threshold between new/previous thumbnail that determines motion happened
   * returns true if motion was detected, false otherwise.
   */
  private detectMotion = (newThumb: Jimp, prevThumb: Jimp, hotspots: HotspotBoundingBox[], motionSensitivity: number): boolean => {
    // Set a max distance value as a multipler for motion sensitivity comparison.
    const maxDistance = Math.sqrt(Math.pow(255,2) + Math.pow(255,2) + Math.pow(255,2));
    
    // Return true on the first pixel that crosses the motion sensitivity threshold.
    for (const hotspot of hotspots) {
      for (const x of [...Array(hotspot.width).keys()]){
        for (const y of [...Array(hotspot.height).keys()]) {
          const rgbPrev = Jimp.intToRGBA(prevThumb.getPixelColor(x + hotspot.left, y + hotspot.top));
          const rgbNew = Jimp.intToRGBA(newThumb.getPixelColor(x + hotspot.left, y + hotspot.top));
          const distance = Math.sqrt(
            Math.pow(rgbPrev.r - rgbNew.r, 2) + 
            Math.pow(rgbPrev.g - rgbNew.g, 2) + 
            Math.pow(rgbPrev.b - rgbNew.b, 2)
          );

          if (
            distance > 0 && 
            (distance / maxDistance) * 100 >= motionSensitivity
          ) {
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
   * Process the new cam image stack one item at a time as available.
   */
  private processNewImageStack = async (): Promise<void> => {
    if (this.newImageBusy === false && this.newImageStack.length > 0) {
      // Don't process other stack items until this one is finished.
      this.newImageBusy = true;

      // Take the top/last item in the stack.
      const stackImage = this.newImageStack.pop();

      try {
        // Get the image thumbnail for comparison with previous thumbnail when detecting motion
        const thumbPath = await this.extractThumbnailAsFile(stackImage, this.options.tempImageDirectory);
        const newThumb = await this.loadThumbnail(thumbPath);
        
        // Detect motion.
        const motionDetected = this.detectMotion(newThumb, this.previousThumb, this.motionHotspots, this.options.motionSensitivity);

        // Upload image if motion was detected.
        if (motionDetected) {
          const movedImage = await this.moveFile(stackImage, this.options.readyImageDirectory);
          this.previousThumb = newThumb;
          this.uploadImageStack.push(movedImage);
        }
      } catch (err) {
        console.error('processNewImageStack error', err);
      }

      // All done, open for next item in the stack
      this.newImageBusy = false;
    }
    return;
  }

  private processImageUploadStack = (): void => {
    // TODO
  }

  /**
   * Check if a parsed hotspot used for motion sensing is within bounds of thumbnail width/height.
   * @param hotspot - a hotspot to check if valid or not
   */
  private hotspotIsValid = (hotspot: HotspotBoundingBox, thumbWidth: number, thumbHeight: number) => {
    const valid = hotspot.left >= 0 && hotspot.left <= thumbWidth &&
        hotspot.top >= 0 && hotspot.top <= thumbHeight &&
        hotspot.width > 0 && hotspot.width <= thumbWidth &&
        hotspot.height > 0 && hotspot.height <= thumbHeight &&
        hotspot.top + hotspot.height <= thumbHeight &&
        hotspot.left + hotspot.width <= thumbWidth;

    if (!valid) {
      console.error(`hotspotIsValid error: provided hotspot not valid for ${thumbWidth}, ${thumbHeight}`, hotspot);
    }
    return valid;
  }

  /**
   * Convert provided hotspot percent values to thumbnail pixels used in hotspot comparisons.
   * Example: width of 20% (20) on thumbnail option of 64px (64) wide would return rounded 13 pixels.
   */
  private hotspotPercentToPixels = (percent: number, pixels: number) => Math.round((percent * 0.01) * pixels);

  /**
   * Parse environment variable hotspot string into an array of hotspots/boxes where motion will be detected.
   * Hotspots are handy if not wanting to capture constantly changing areas of an image e.g. a highway of cars
   * or a spot where tree leaf shadows cause motion detection with the slightest breeze.
   * Example input covering 100% of the image:
   * '0,0,100,100'
   * Example with two hotspots: a centered box and a top-to-bottom box aligned to the right:
   * '25,25,50,50|0,85,15,100'
   * @param hotspotString - string of hotspots from environment variable or config that needs parsed into array.
   * returns an array of hotspots
   */
  private setMotionHotspots = (hotspotString: string): HotspotBoundingBox[] => {
    // Break out into typed values.
    const boxStrings = hotspotString.split('|');
    const hotspots = boxStrings.map((boxString: string) => {
      const boxSplit = boxString.split(',');
      const hotspot: HotspotBoundingBox = {
        left: this.hotspotPercentToPixels(Number(boxSplit[0]), this.options.thumbWidth),
        top: this.hotspotPercentToPixels(Number(boxSplit[1]), this.options.thumbHeight),
        width: this.hotspotPercentToPixels(Number(boxSplit[2]), this.options.thumbWidth),
        height: this.hotspotPercentToPixels(Number(boxSplit[3]), this.options.thumbHeight)
      };
      return hotspot;
    })

    // Filter out anything not right.
    .filter((hotspot: HotspotBoundingBox) => this.hotspotIsValid(hotspot, this.options.thumbWidth, this.options.thumbHeight));

    // Set hotspots used when calculating motion detection.
    if (hotspots.length > 0) {
      return hotspots;
    } else {
      // Add default hotspot(s) if provided value(s) were invalid.
      return this.setMotionHotspots(this.defaultOptions.motionHotspots);
    }
  }

  /**
   * Get things going.
   * TODO: Consider switching to RxJs observables instead of using intervals.
   */
  public init = (): void => {
    // Set hotspots for detecting motion in cam image thumbnails.
    this.motionHotspots = this.setMotionHotspots(this.options.motionHotspots);
    
    // Watch for new camera images and add them to the stack to be processed.
    this.camWatcher = this.watchCamImages();

    // Process the cam image stack one item at a time as not busy.
    // setInterval(this.processNewImageStack, 500);
    setInterval(() => this.processNewImageStack, 500);

    // Process the image upload stack
    setInterval(this.processImageUploadStack, 100);
  }

}