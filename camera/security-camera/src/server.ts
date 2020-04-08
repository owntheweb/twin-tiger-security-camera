import { RaspistillManager } from './raspistill-manager';
import { RaspistillManagerOptions } from './model/raspistill-manager-options';
import { MotionCapturer } from './motion-capturer';
import { MotionCapturerOptions } from './model/motion-capturer-options';
import { 
  imageWidth,
  imageHeight,
  imageQuality,
  imageRotation,
  thumbWidth,
  thumbHeight,
  raspicamExposure,
  settingResetInterval,
  awsEndpoint,
  awsPrivateCert,
  awsRootCert,
  awsThingCert,
  motionSensitivity,
  motionHotspots, 
  dbRecordTtl
} from './config';

////////////////////////
// raspistill manager //
////////////////////////

const raspistillOptions: RaspistillManagerOptions = {
  imageWidth,
  imageHeight,
  imageQuality,
  imageRotation,
  thumbWidth,
  thumbHeight,
  raspicamExposure,
  settingResetInterval,
};
const raspistillManager = new RaspistillManager(raspistillOptions);

// Get things going!
console.log('Initializing raspistill manager...');
raspistillManager.run();

/////////////////////
// motion capturer //
/////////////////////

const motionCapturerOptions: MotionCapturerOptions = {
  awsEndpoint,
  awsPrivateCert,
  awsRootCert,
  awsThingCert,
  motionSensitivity,
  motionHotspots, 
  dbRecordTtl,
  thumbWidth,
  thumbHeight
};
const motionCapturer = new MotionCapturer(motionCapturerOptions);

// Get things going!
console.log('Initializing motion capturer...');
motionCapturer.run();
