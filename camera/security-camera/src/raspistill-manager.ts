/**
 * Manage the raspicam application, taking continuous photos at optimal exposure.
 * TODO: Options are still brittle and need further validation work.
 * TODO: Experiment with other ways to set best camera settings for current lighting.
 * TODO: Consider adding a lighting sensor to the Pi?
 */

import { RaspistillManagerOptions } from './model/raspistill-manager-options';
import { get } from 'lodash';
import findRemoveSync from 'find-remove';
import { CmdUtils } from './util/cmd-utils';

export class RaspistillManager {
  
  // Provided options via constructor parameter
  protected readonly options: RaspistillManagerOptions;
  
  // Default fallback options
  protected defaultOptions: RaspistillManagerOptions = {
    imageDirectory: '/image-temp',
    imageWidth: 1920,
    imageHeight: 1080,
    imageQuality: 75,
    imageRotation: 0,
    thumbWidth: 20,
    thumbHeight: 16
  }
  
  constructor(options: RaspistillManagerOptions) {
    // Set options based on input or defaults if not provided.
    this.options = {
      imageDirectory: get(options, 'imageDirectory', this.defaultOptions.imageDirectory),
      imageWidth: get(options, 'imageWidth', this.defaultOptions.imageWidth),
      imageHeight: get(options, 'imageHeight', this.defaultOptions.imageHeight),
      imageQuality: get(options, 'imageQuality', this.defaultOptions.imageQuality),
      imageRotation: get(options, 'imageRotation', this.defaultOptions.imageRotation),
      thumbWidth: get(options, 'thumbWidth', this.defaultOptions.thumbWidth),
      thumbHeight: get(options, 'thumbHeight', this.defaultOptions.thumbHeight)
    };
  }

  /**
   * Start the raspistill application that will take continuous photos once per second
   * (which seems to do this with little effort), saving to RAM (tempfs) drive so not
   * to burn out the MicroSD card. motion-picture-capturer container will manage motion
   * detection and move images that need saved out of tempfs.
   */
  protected startRaspistill = async (): Promise<void> => {
    console.log('Starting raspistill...');

    // Execute command
    try {
      const args = ['-10',
        '/usr/bin/raspistill',
        '-o', `${this.options.imageDirectory}/${this.options.imageWidth}-${this.options.imageHeight}-%04d.jpg`,
        '-q', `${this.options.imageQuality}`,
        '-t', '0',
        '-tl', '1000',
        '-rot', `${this.options.imageRotation}`,
        '-th', `${this.options.thumbWidth}:${this.options.thumbHeight}:100`,
        '-n',
        '-ex', 'sports', // opt for fastest frame rate for now
        '-w', `${this.options.imageWidth}`,
        '-h', `${this.options.imageHeight}`
      ];
      const cmdOutput = await CmdUtils.spawnAsPromise('/usr/bin/nice', args);

      // Once finished, start again with fresh calibration.
      console.log('raspicam process exited: ', cmdOutput);
      this.startRaspistill();
    } catch (err) {
      console.log('raspicam process error: ', err);
      // Start a new process on error.
      this.startRaspistill();
    }
  }

  /**
   * Clear out old images so that the tmpfs RAM drive doesn't max out.
   */
  protected deleteOldImages = () => {
    findRemoveSync(this.options.imageDirectory, {age: {seconds: 10}, extensions: '.jpg'});
  }

  /**
   * Once raspicam gets started with continuous photos, it sticks with the same settings until stopped.
   * Reset at intervals in an attempt to keep capture settings reasonable with current lighting.
   * NOTE: Not running continuous photos results in two+ second delays before the first photo is captured.
   * Not ideal when attempting to capture motion in the moment. Revisit this.
   */
  public init = (): void => {
    // Get started right away
    this.startRaspistill();
    
    // Clear out old images to prevent RAM drive from maxing out.
    setInterval(this.deleteOldImages, 1000);
  }
}
