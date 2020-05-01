/**
 * Upload image and metadata to AWS as an AWS IoT thing.
 */

import { thingShadow, ThingShadowOptions } from 'aws-iot-device-sdk';
import { DataUploaderOptions } from './model/data-uploader-options';
import { SignedUrl } from './model/signed-url';
import { SignedUrlBulkPutRequest } from './model/signed-url-bulk-put-request';
import { get } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export declare interface DataUploader {
  on(event: 'ready', listener: () => void): this;
  on(event: string, listener: Function): this;
}

export class DataUploader extends EventEmitter {
  
  // Provided options via constructor parameter
  protected readonly options: DataUploaderOptions;

  // AWS IoT thing shadows (multiple can be tracked, we'll track one for now)
  protected thingShadows: thingShadow;
  
  // Listen for fulfilled S3 signed URL requests.
  protected sendS3SignedUrlRequestsTopic = 'iot/service/s3SignedUrlRequests';
  protected receiveS3SignedUrlRequestsTopic: string; // to be set with dynamic client id

  // When uploading images with an IoT device, direct S3 access is not permitted
  // out-of-the-box. However, temporary signed URLs (one per image) to an S3 bucket
  // can be requested so that mages can be uploaded directly via https.
  protected signedUrls: SignedUrl[] = [];
  protected signedUrlsTimeout: NodeJS.Timer;
  protected signedUrlsTimeoutRetry = 30000; // 30 seconds
  protected signedUrlExpiresIn = 290000; // 5 minutes (set in Lambda) minus 10 seconds

  constructor(options: DataUploaderOptions) {
    super();

    // Set options based on input or defaults if not provided.
    this.options = {
      awsEndpoint: get(options, 'awsEndpoint', ''), // empty will throw an error
      awsPrivateCert: get(options, 'awsPrivateCert', ''), // empty will throw an error
      awsCaCert: get(options, 'awsCaCert', ''), // empty will throw an error
      awsThingCert: get(options, 'awsThingCert', ''), // empty will throw an error
      awsRegion: get(options, 'awsRegion', ''), // empty will throw an error
      awsImageS3BucketName: get(options, 'awsImageS3BucketName', ''), // empty will throw an error
      awsMqttClientId: get(options, 'awsMqttClientId', this.createUniqueClientId())
    };

    // Proceed no further if AWS options are not set properly.
    if (!this.options.awsEndpoint ||
        !this.options.awsPrivateCert ||
        !this.options.awsCaCert ||
        !this.options.awsThingCert ||
        !this.options.awsRegion ||
        !this.options.awsImageS3BucketName) {
      throw new Error('DataUploader constructor: AWS IoT options are required.');
    }

    // Set camera MQTT topic names for incoming messages.
    this.receiveS3SignedUrlRequestsTopic = `iot/camera/${this.options.awsMqttClientId}/SignedUrlResponses`;
  }

  /**
   * Initialize AWS IoT thing shadow.
   * TODO: It's desired to update camera preferences by the user via a thing shadow
   * in the future, so use 'thingShadow' instead of just 'device' to start.
   */
  protected initThingShadow = () => {
    // Create thing shadow: extends IoT 'device' with extra device state that can
    // get/update online or offline (can sync when online)
    const thingShadowOptions: ThingShadowOptions = {
      clientCert: Buffer.from(this.options.awsThingCert, 'base64'),
      caCert: Buffer.from(this.options.awsCaCert, 'base64'),
      privateKey: Buffer.from(this.options.awsPrivateCert, 'base64'),
      clientId: this.options.awsMqttClientId,
      host: this.options.awsEndpoint,
      region: this.options.awsRegion
    };
    
    this.thingShadows = new thingShadow(thingShadowOptions);

    this.thingShadows.on('connect', () => {
      console.log('connected');
      // TODO: Register interest in thing shadows by name and update as needed here.

      // Subscribe to camera MQTT topics.
      this.subscribeToMqttTopic(this.receiveS3SignedUrlRequestsTopic);

      // Request an initial batch of signed URLs for use in uploading camera images.
      this.requestSignedUrls({
        iotEndpoint: this.options.awsEndpoint,
        bucket: this.options.awsImageS3BucketName,
        urlCount: 10,
        replyTo: this.receiveS3SignedUrlRequestsTopic
      }, this.sendS3SignedUrlRequestsTopic);

      // Let the world know we're ready for business.
      this.emitReady();
    });

    // Report the status of update(), get(), and delete() calls.
    this.thingShadows.on('status', (thingName, stat, clientToken, stateObject) => {
      const tmpObj = JSON.stringify(stateObject);
      console.log(`received ${stat} on ${thingName}: ${tmpObj}`);
    });

    // Act on MQTT topic subscription messages.
    this.thingShadows.on('message', (topic, message) => {
      const parsedMessage = JSON.parse(message.toString());
      console.log(`message received for ${topic}`);
      
      if (topic === this.receiveS3SignedUrlRequestsTopic) {
        // Add new signed URL(s) received.
        this.signedUrls = this.combineNewSignedUrls(parsedMessage, this.signedUrls);
      }
    });

    // Emitted when a different client's update or delete operation is accepted on the shadow.
    this.thingShadows.on('foreignStateChange', (thingName, operation, stateObject) => {
      const tmpObj = JSON.stringify(stateObject); 
      console.log(`foreignStateChange happened for ${thingName}, ${operation}: ${tmpObj}`);
    });

    // Emitted when a delta has been received for a registered Thing Shadow.
    this.thingShadows.on('delta', (thingName, stateObject) => {
      const tmpObj = JSON.stringify(stateObject); 
      console.log(`received delta on ${thingName}: ${tmpObj}`);
    });

    // Emitted when an operation update|get|delete has timed out.
    this.thingShadows.on('timeout', (thingName, clientToken) => {
      console.log(`timeout for ${thingName}: ${clientToken}`);
    });
  }

  /**
   * Subscribe to an MQTT topic.
   */
  protected subscribeToMqttTopic = (topicName: string): void => {
    this.thingShadows.subscribe(topicName, { qos: 1 }, err => {
      if (!err) {
        console.log(`subscribed to ${topicName}`);
      } else {
        console.error(`subscribeToMqttTopic error: ${err.message}`);
        throw new Error(`subscribeToMqttTopic: unable to subscribe to topic: ${topicName}`);
      }
    });
  }

  /**
   * Make a bulk request for signed URLs that will be picked up by a TopicRule
   * and handled by Lambda. The returned signed URLs to another subscribed topic
   * will be used to upload images to S3 via https as IoT devices don't have access
   * to upload directly otherwise (beats uploading images via MQTT which is not
   * recommended, is messy, costly).
   */
  protected requestSignedUrls = (signedUrlRequest: SignedUrlBulkPutRequest, sendTo: string): void => {
    if (!this.signedUrlsTimeout) {
      this.thingShadows.publish(sendTo, JSON.stringify(signedUrlRequest), { qos: 1 }, (err: Error) => {
        if (!err) {
          console.log(`${signedUrlRequest.urlCount} URLs requested`);
        } else {
          console.error(`requestSignedUrls error: ${err.message}`);
        }
      });
    } else {
      // try again soon, network connectivity may be bad
      this.signedUrlsTimeout = setTimeout(() => {
        this.requestSignedUrls(signedUrlRequest, sendTo);
      }, this.signedUrlsTimeoutRetry);
    }
  }

  /**
   * Add new signed URLs received from incoming MQTT topic.
   */
  protected combineNewSignedUrls = (newUrls: string[], existingUrls: SignedUrl[]): SignedUrl[] => {
    const newSignedUrls = newUrls.map(url => {
      const signedUrl: SignedUrl = {
        url,
        ttl: new Date(Date.now() + this.signedUrlExpiresIn)
      }
      return signedUrl;
    });
    return [...existingUrls, ...newSignedUrls];
  }

  /**
   * Generate a unique MQTT client id so not to collide with other ids in use.
   */
  protected createUniqueClientId = (): string => {
    const randId = uuidv4();
    console.log(`Camera MQTT client ID: camera-${randId}`);
    return `camera-${randId}`;
  }

  /**
   * Emit an event that the DataUploader has connected to AWS. There's no need to
   * continue otherwise.
   */
  protected emitReady(): void {
    this.emit('ready');
  }

  /**
   * Get things going.
   */
  public init = (): void => {
    this.initThingShadow();
  }
}