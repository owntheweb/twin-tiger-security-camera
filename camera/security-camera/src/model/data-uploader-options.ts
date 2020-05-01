// DataUploader options
export interface DataUploaderOptions {
  // AWS IoT endpoint found in IoT settings in management console
  awsEndpoint: string;

  // AWS IoT private certificate for single device as base64 string
  awsPrivateCert: string;

  // AWS IoT CA certificate as base64 string
  awsCaCert: string;

  // AWS IoT thing certificate for single device as base64 string
  awsThingCert: string;

  // AWS IoT region where thing settings live
  awsRegion: string;

  // S3 bucket name where images will be stored
  awsImageS3BucketName: string;

  // an MQTT client id that needs to be unique amongst all other client ids
  awsMqttClientId?: string;
}
