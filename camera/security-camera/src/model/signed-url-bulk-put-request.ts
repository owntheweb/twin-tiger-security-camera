// AWS signed URL requests happen one at a time. Let Lambda make those requests
// for return of a single array of generated URLs used for image uploads.
export interface SignedUrlBulkPutRequest {
  // AWS IoT endpoint for MQTT topic communication
  iotEndpoint: string;
  
  // S3 bucket to put to
  bucket: string;

  // Number of signed URLs to request
  urlCount: number;

  // MQTT topic signed URL requests will be responded to
  replyTo: string;
}
