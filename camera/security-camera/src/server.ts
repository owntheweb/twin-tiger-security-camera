import { RaspistillManager } from './raspistill-manager';
import { RaspistillManagerOptions } from './model/raspistill-manager-options';
import { MotionCapturer } from './motion-capturer';
import { MotionCapturerOptions } from './model/motion-capturer-options';
import { DataUploaderOptions } from './model/data-uploader-options';
import { DataUploader } from './data-uploader';
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
  awsCaCert,
  awsThingCert,
  awsRegion,
  awsImageS3BucketName,
  motionSensitivity,
  motionHotspots, 
  dbRecordTtl
} from './config';

try {
  ///////////////////
  // data uploader //
  ///////////////////

  const dataUploaderOptions: DataUploaderOptions = {
    awsEndpoint,
    awsPrivateCert,
    awsCaCert,
    awsThingCert,
    awsRegion,
    awsImageS3BucketName
  }

  const dataUploader = new DataUploader(dataUploaderOptions);
  dataUploader.init();

  // Restart balena.io app and try again if unable to connect.
  const noConnectTimer = setTimeout(() => {
    console.log('Unable to connect to AWS, trying again...');
    process.exit();
  }, 30000);

  // Only continue if able to connect to AWS.
  dataUploader.on('ready', () => {
    clearTimeout(noConnectTimer);
    
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
      dataUploader,
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

  });

} catch (err) {
  console.log(`server error: ${err.message}`);
} finally {
  // If the app exits due to a major error, balena.io will restart the app automatically.
  console.log('Restarting...');
}
