import { MotionCapturer } from './motion-capturer';
import { MotionCapturerOptions } from './model/motion-capturer-options';
import { HotspotBoundingBox } from './model/hotspot-bounding-box';
import { config } from 'dotenv';

// run dotenv.config()
config();

// TODO: Future: Consider reading from online user preferences, reading from balena.io device env vars for now.
const options: MotionCapturerOptions = {
  awsEndpoint: process.env.AWS_ENDPOINT || null,
  awsPrivateCert: process.env.AWS_PRIVATE_CERT || null,
  awsRootCert: process.env.AWS_ROOT_CERT || null,
  awsThingCert: process.env.AWS_THING_CERT || null,
  motionSensitivity: Number(process.env.MOTION_SENSITIVITY) || null,
  motionHotspots: process.env.MOTION_HOTSPOTS || null, 
  dbRecordTtl: Number(process.env.DB_RECORD_TTL) || null,
  thumbWidth: Number(process.env.THUMB_WIDTH) || null,
  thumbHeight: Number(process.env.THUMB_HEIGHT) || null
};
const motionCapturer = new MotionCapturer(options);

// Get things going!
console.log('Initializing motion capturer...');
motionCapturer.init();