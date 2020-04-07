import { RaspistillManager } from './raspistill-manager';
import { RaspistillManagerOptions } from './model/raspistill-manager-options';
import { RaspistillExposure } from './model/raspistill-exposure';
import { config } from 'dotenv';

// run dotenv.config()
config();

// TODO: Future: Consider reading from online user preferences, reading from balena.io device env vars for now.
const exposureEnumVal = process.env.RASPICAM_EXPOSURE_MODE.toString() as keyof typeof RaspistillExposure;
const options: RaspistillManagerOptions = {
  imageWidth: Number(process.env.IMAGE_WIDTH) || null,
  imageHeight: Number(process.env.IMAGE_HEIGHT) || null,
  imageQuality: Number(process.env.IMAGE_QUALITY) || null,
  imageRotation: Number(process.env.IMAGE_ROTATION) || null,
  thumbWidth: Number(process.env.THUMB_WIDTH) || null,
  thumbHeight: Number(process.env.THUMB_HEIGHT) || null,
  raspicamExposure: RaspistillExposure[exposureEnumVal] || null,
  settingResetInterval: Number(process.env.RASPICAM_RESET_INTERVAL) || null,
};
const raspistillManager = new RaspistillManager(options);

// Get things going!
console.log('Initializing raspistill manager...');
raspistillManager.init();