/**
 * Obtain security-camera configuration in a centralized config.
 */

import { RaspistillExposure } from './model/raspistill-exposure';
import { config } from 'dotenv';
config();

// Convert env var string for raspistill exposure setting to a typed enumerator value (that errors if invalid).
// TODO: exposureEnumVal is not right yet. Use 'sports' setting temporarily and address as soon as possible:
// const exposureEnumVal = process.env.RASPICAM_EXPOSURE_MODE.toString() as keyof typeof RaspistillExposure;
const exposureEnumVal = RaspistillExposure.SPORTS;

// Get fleet/device environment variables set at balena.io dashboard or CLI, passed through docker to here.
const configOptions = {
  imageWidth: Number(process.env.IMAGE_WIDTH) || null,
  imageHeight: Number(process.env.IMAGE_HEIGHT) || null,
  imageQuality: Number(process.env.IMAGE_QUALITY) || null,
  imageRotation: Number(process.env.IMAGE_ROTATION) || null,
  thumbWidth: Number(process.env.THUMB_WIDTH) || null,
  thumbHeight: Number(process.env.THUMB_HEIGHT) || null,
  raspicamExposure: exposureEnumVal || null,
  settingResetInterval: Number(process.env.RASPICAM_RESET_INTERVAL) || null,
  awsEndpoint: process.env.AWS_ENDPOINT || null,
  awsPrivateCert: process.env.AWS_PRIVATE_CERT || null,
  awsCaCert: process.env.AWS_ROOT_CERT || null,
  awsThingCert: process.env.AWS_THING_CERT || null,
  awsRegion: process.env.AWS_REGION,
  awsImageS3BucketName: process.env.AWS_IMAGE_BUCKET,
  motionSensitivity: Number(process.env.MOTION_SENSITIVITY) || null,
  motionHotspots: process.env.MOTION_HOTSPOTS || null, 
  dbRecordTtl: Number(process.env.DB_RECORD_TTL) || null
}

// Not super pretty, yet makes simple for statements such as:
// import { imageWidth } from './config';
export const {
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
} = configOptions;