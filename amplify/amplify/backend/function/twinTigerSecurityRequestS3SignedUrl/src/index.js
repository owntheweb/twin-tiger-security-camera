/**
 * Fulfill IoT signed url requests, triggered by AWS IoT Topic Rule query
 * TODO: Figure out best way to upgrade this to TypeScript using AWS Amplify
 */

const AWS = require('aws-sdk');
const uuid = require('uuid');

/**
 * Generate a key for an uploaded image
 * Note: This makes an assumption that images are .jpg for now.
 */
const generateKey = () => {
  const id = uuid.v4();
  return `${id}.jpg`;
}

/**
 * AWS Lambda handler
 * Thanks: https://spindance.com/2018/03/15/pattern-secure-uploads-downloads-aws-iot/
 */
exports.handler = (event, context, callback) => {
  console.log(event);
  const iotdata = new AWS.IotData({endpoint: event.iotEndpoint});
  const s3 = new AWS.S3();
  
  
  // Get Signed URLs
  let signedUrls = [];
  let params = {};
  for (i=0; i<event.urlCount; i++) {
    params = {
      Bucket: event.bucket,
      Key: generateKey(),
      Expires: 300,
      ContentType: 'image/jpeg'
    };
    signedUrls.push(s3.getSignedUrl('putObject', params));
  }

  // Respond to device requested topic.
  const responseParams = {
    topic: event.replyTo,
    payload: JSON.stringify(signedUrls),
    qos: 1
  };

  iotdata.publish(responseParams, (err, data) => {
    if(err){
      console.error(err);
    } else {
      // TODO: Put in a better spot, revisit
      context.done(null, `Successfully returned ${event.urlCount} signed URLs.`); // SUCCESS with message
    }
  });
};