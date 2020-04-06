// MotionCapturer capturer options
export interface MotionCapturerOptions {
  // AWS IoT endpoint found in IoT settings in management console
  awsEndpoint: string;

  // AWS IoT private certificate for single device
  awsPrivateCert: string;

  // AWS IoT root certificate
  awsRootCert: string;

  // AWS IoT thing certificate for single device
  awsThingCert: string;

  // New incoming images get placed in this temporary directory.
  tempImageDirectory?: string;

  // Images ready to upload get moved to disk here, great for when there is slow internet or outages.
  readyImageDirectory?: string;

  // RGB percent difference that triggers motion detection e.g. 10.0 (10 percent difference triggers detection)
  motionSensitivity?: number;

  // String representing array of hotspot bounding boxes of where in the thumbnail to look for motion to cut down on unnecessary uploads
  // Format: top,left,width,height|top,left,width,height
  // Example: 0,0,100,100
  // Example: 25,25,50,50|0,85,15,100
  motionHotspots?: string;

  // DB record time to live: number of days when the record will be auto-deleted
  dbRecordTtl?: number;

  // raspistill embedded thumb width
  thumbWidth?: number;

  // raspistill embedded thumb height
  thumbHeight?: number;
  
}
