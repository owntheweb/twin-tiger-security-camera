/**
 * Manage the raspicam application, taking continuous photos at optimal exposure.
 * TODO: Experiment with other ways to set best camera settings for current lighting.
 * TODO: Consider adding a lighting sensor to the Pi?
 * NOTE: suncalc was used previously, yet not great for indoor cameras.
 * NOTE: ISO was set previously for different lighting based on suncalc, keep in mind for future light sensor
 */

import { RaspistillManagerOptions } from './model/raspistill-manager-options';
import { RaspistillExposure } from './model/raspistill-exposure';
import { get, isNil } from 'lodash';
import { spawn, ChildProcess } from 'child_process';
import findRemoveSync from 'find-remove';

export class RaspistillManager {
  
  // Provided options via constructor parameter
  private options: RaspistillManagerOptions;
  
  // Default fallback options
  private defaultOptions: RaspistillManagerOptions = {
    imageDirectory: '/image-temp',
    imageWidth: 1920,
    imageHeight: 1080,
    imageQuality: 75,
    imageRotation: 0,
    thumbWidth: 20,
    thumbHeight: 16,
    raspicamExposure: RaspistillExposure.SPORTS,
    settingResetInterval: 300000,
  }

  // Track raspicam process for easy reset.
  private raspicamProcess: ChildProcess;
  
  // Raspicam exited due to exit or error
  private raspicamExited = false;
  
  constructor(options: RaspistillManagerOptions) {
    // Set options based on input or defaults if not provided.
    this.options = {
      imageDirectory: get(options, 'imageDirectory', this.defaultOptions.imageDirectory),
      imageWidth: get(options, 'imageWidth', this.defaultOptions.imageWidth),
      imageHeight: get(options, 'imageHeight', this.defaultOptions.imageHeight),
      imageQuality: get(options, 'imageQuality', this.defaultOptions.imageQuality),
      imageRotation: get(options, 'imageRotation', this.defaultOptions.imageRotation),
      thumbWidth: get(options, 'thumbWidth', this.defaultOptions.thumbWidth),
      thumbHeight: get(options, 'thumbHeight', this.defaultOptions.thumbHeight),
      raspicamExposure: get(options, 'raspicamExposure', this.defaultOptions.raspicamExposure),
      settingResetInterval: get(options, 'settingResetInterval', this.defaultOptions.settingResetInterval),
    };
  }

  /**
   * Start the raspistill application that will take continuous photos once per second
   * (which seems to do this with little effort), saving to RAM (tempfs) drive so not
   * to burn out the MicroSD card. motion-picture-capturer container will manage motion
   * detection and move images that need saved out of tempfs.
   */
  private startRaspistill = () => {
    this.raspicamExited = false;
    
    this.raspicamProcess = spawn('/usr/bin/nice', ['-10',
      '/usr/bin/raspistill',
      '-o', `${this.options.imageDirectory}/${this.options.imageWidth}-${this.options.imageHeight}-%04d.jpg`,
      '-q', `${this.options.imageQuality}`,
      '-t', '0',
      '-tl', '1000',
      '-rot', `${this.options.imageRotation}`,
      '-th', `${this.options.thumbWidth}:${this.options.thumbHeight}:100`,
      '-n',
      '-ex', `${this.options.raspicamExposure}`,
      '-w', `${this.options.imageWidth}`,
      '-h', `${this.options.imageHeight}`
    ]);

    // Start new raspistill app with fresh lighting readings on exit.
    this.raspicamProcess.on('exit', (code, signal) => {
      console.log('raspicamProcess exited: ', code, signal);
      this.raspicamExited = true;
      this.raspicamProcess = null;
      this.startRaspistill();
    });
    
    // Start a new process on error
    // From docs, it seems that exit won't always be called on error.
    // TODO: Confirm this. Is it actually exiting on error?
    this.raspicamProcess.on('error', err => {
      console.log('raspicamProcess error: ', err);
      if (!this.raspicamExited) {
        this.raspicamExited = true;
        this.raspicamProcess = null;
        this.startRaspistill();
      }
    });
  }

  /**
   * Kill raspicam if running and restart it, or start if script just getting started.
   */
  private resetRaspistill = (): void => {
    // Kill the process if running.
    if (!isNil(this.raspicamProcess)) {
      // Killing raspistill will trigger a new raspistill process.
      console.log('Killing raspistill process...');
      this.raspicamProcess.kill('SIGINT');
    } else {
      // Start a new process
      this.startRaspistill();
    }
  }

  /**
   * Clear out old images so that the tmpfs RAM drive doesn't max out.
   */
  private deleteOldImages = () => {
    findRemoveSync(this.options.imageDirectory, {age: {seconds: 10}, extensions: '.jpg'});
  }

  /**
   * Once raspicam gets started with continuous photos, it sticks with the same settings until stopped.
   * Reset at intervals in an attempt to keep capture settings reasonable with current lighting.
   * NOTE: Not running continuous photos results in two+ second delays before the first photo is captured.
   * Not ideal when attempting to capture motion in the moment. Revisit this.
   */
  public init = (): void => {
    // Reset raspistill to get fresh camera light settings.
    setInterval(this.resetRaspistill, this.options.settingResetInterval);
    
    // Clear out old images to prevent RAM drive from maxing out.
    setInterval(this.deleteOldImages, 1000);

    // Get started right away
    this.startRaspistill();
  }

}