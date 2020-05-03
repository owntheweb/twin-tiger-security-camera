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

/**
 * Return a data uploader that has signaled as 'ready'.
 */
const getDataUploader = (dataUploaderOptions: DataUploaderOptions): Promise<DataUploader> => {
  return new Promise((resolve, reject) => {
    const dataUploader = new DataUploader(dataUploaderOptions);
    dataUploader.init();

    // Reject if unable to connect after 30 seconds
    const noConnectTimer = setTimeout(() => {
      reject('Unable to connect to AWS.');
    }, 30000);

    // Resolve once ready
    dataUploader.on('ready', () => {
      clearTimeout(noConnectTimer);
      resolve(dataUploader);
    });
  });
}

const go = async () => {
  // Start data uploader.
  console.log('Initializing data uploader...');
  const dataUploaderOptions: DataUploaderOptions = {
    awsEndpoint,
    awsPrivateCert,
    awsCaCert,
    awsThingCert,
    awsRegion,
    awsImageS3BucketName
  };
  const dataUploader = await getDataUploader(dataUploaderOptions);
  
  // Start raspistill manager.
  console.log('Initializing raspistill manager...');
  const raspistillOptions: RaspistillManagerOptions = {
    imageWidth,
    imageHeight,
    imageQuality,
    imageRotation,
    thumbWidth,
    thumbHeight,
    settingResetInterval,
  };
  const raspistillManager = new RaspistillManager(raspistillOptions);
  await raspistillManager.init();

  // Start motion capturer.
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
};

try {
  go();
} catch (err) {
  console.log(`server error: ${err.message}`);
  process.exit();
}
