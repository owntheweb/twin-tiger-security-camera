import sinon from 'sinon';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { DataUploaderOptions } from '../model/data-uploader-options';
import { DataUploader } from '../data-uploader';
import awsIot from 'aws-iot-device-sdk';
import { EventEmitter } from 'events';
import { SignedUrlBulkPutRequest } from '../model/signed-url-bulk-put-request';

const dataUploaderOptions: DataUploaderOptions = {
  awsEndpoint: 'something.iot.us-east-1.amazonaws.com',
  awsPrivateCert: 'base64CertString',
  awsCaCert: 'base64CertString',
  awsThingCert: 'base64CertString',
  awsRegion: 'us-east-1',
  awsImageS3BucketName: 'someBucket'
}

describe("DataUploader: constructor", () => {
  it("should successfully initialize", () => {
    const dataUploader = new DataUploader(dataUploaderOptions);
    expect(dataUploader).to.not.be.null;
  });

  it("should throw an error if required AWS options are not set", () => {
    // with set options
    const uploaderOptions: DataUploaderOptions = {
      awsEndpoint: '',
      awsPrivateCert: '',
      awsCaCert: '',
      awsThingCert: '',
      awsRegion: '',
      awsImageS3BucketName: ''
    }
    try {
      const dataUploader = new DataUploader(uploaderOptions);
      // fail
      expect(true).to.be.false;
    } catch (err) {
      // pass
      expect(err.message).to.equal('DataUploader constructor: AWS IoT options are required.');
    }
    
  });
});

describe("DataUploader: createUniqueClientId", () => {
  it("should return an id", () => {
    class TestDataUploader extends DataUploader {
      public testCreateUniqueClientId = () => {
        return this.createUniqueClientId();
      }
    }
    const dataUploader = new TestDataUploader(dataUploaderOptions);
    
    const id = dataUploader.testCreateUniqueClientId();
    
    expect(id).to.contain('camera-');
    expect(id.length).to.equal(43);
  });
});

describe("DataUploader: emitReady", () => {
  it("should emit 'ready' event", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        public testEmitReady = () => {
          this.emitReady();
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // DataUploader extends EventEmitter, check that emit is being called.
      sandbox.spy(dataUploader, 'emit');

      dataUploader.testEmitReady();

      // @ts-ignore: Unreachable code error
      expect(dataUploader.emit.calledWith('ready')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });
});

describe("DataUploader: init", () => {  
  it("should call initThingShadow()", () => {
    const sandbox = sinon.createSandbox();
    try {
      // public init() should call initThingShadow();
      class TestDataUploader extends DataUploader {
        protected initThingShadow = () => {
          console.log('initThingShadow() was called.');
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);
      
      // Watch for console.log on void returns
      sandbox.spy(console, 'log');
      
      // Initialize DataUploader
      dataUploader.init();

      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('initThingShadow() was called.')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });
});

describe("DataUploader: initThingShadow", () => {
  it("should call without error", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        public testInitThingShadow = (): boolean => {
          this.initThingShadow();
          return true;
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Replace thingShadow with all its events initThingShadow() references with an EventEmitter
      sandbox.stub(awsIot, 'thingShadow').returns(new EventEmitter());

      const results = dataUploader.testInitThingShadow();

      expect(results).to.be.true;
    } finally {
      sandbox.restore();
    }
  });

  it("should subscribe to incoming signed url topic, request signed URLs and emit ready once connected", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        protected subscribeToMqttTopic = (topicName: string): void => {
          console.log('subscribeToMqttTopic');
        }

        protected requestSignedUrls = (urlCount: number, sendTo: string): void => {
          console.log('requestSignedUrls');
        }

        protected emitReady = (): void => {
          console.log('emitReady');
        }
        
        public testInitThingShadow = () => {
          this.initThingShadow();
          this.thingShadows.emit('connect');
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Replace thingShadow with all its events initThingShadow() references with an EventEmitter
      sandbox.stub(awsIot, 'thingShadow').returns(new EventEmitter());

      // Watch for console.log on void returns
      sandbox.spy(console, 'log');

      // will initialize and trigger the thingShadow event that should trigger method we want called.
      dataUploader.testInitThingShadow();

      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('subscribeToMqttTopic')).to.be.true;
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('requestSignedUrls')).to.be.true;
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('emitReady')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });

  it("should log on status change (currently not in use, however good to log for troubleshooting)", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        public testInitThingShadow = () => {
          this.initThingShadow();
          this.thingShadows.emit('status', 'theThingName', 'theStat', 'theClientToken', 'theStateObject');
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Replace thingShadow with all its events initThingShadow() references with an EventEmitter
      sandbox.stub(awsIot, 'thingShadow').returns(new EventEmitter());

      // Watch for console.log on void returns
      sandbox.spy(console, 'log');

      // will initialize and trigger the thingShadow event that should trigger method we want called.
      dataUploader.testInitThingShadow();

      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('received theStat on theThingName: "theStateObject"')).to.be.true;

    } finally {
      sandbox.restore();
    }
  });

  it("should update signed URLs when receiving an MQTT message from the subscribed topic", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        public testInitThingShadow = () => {
          this.initThingShadow();
          this.thingShadows.emit('message', this.receiveS3SignedUrlRequestsTopic, '["https://url1","https://url2"]');
        }

        public getSignedUrls = () => {
          return this.signedUrls;
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Replace thingShadow with all its events initThingShadow() references with an EventEmitter
      sandbox.stub(awsIot, 'thingShadow').returns(new EventEmitter());

      // will initialize and trigger the thingShadow event that should trigger method we want called.
      dataUploader.testInitThingShadow();
      const signedUrls = dataUploader.getSignedUrls();

      expect(signedUrls.length).to.equal(2);
    } finally {
      sandbox.restore();
    }
  });

  it("should log on foreignStateChange (currently not in use, however good to log for troubleshooting)", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        public testInitThingShadow = () => {
          this.initThingShadow();
          this.thingShadows.emit('foreignStateChange', 'theThingName', 'theOperation', 'theStateObject');
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Replace thingShadow with all its events initThingShadow() references with an EventEmitter
      sandbox.stub(awsIot, 'thingShadow').returns(new EventEmitter());

      // Watch for console.log on void returns
      sandbox.spy(console, 'log');

      // will initialize and trigger the thingShadow event that should trigger method we want called.
      dataUploader.testInitThingShadow();

      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('foreignStateChange happened for theThingName, theOperation: "theStateObject"')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });

  it("should log on shadow delta change (currently not in use, desired for thing shadow updates when camera preferences change)", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        public testInitThingShadow = () => {
          this.initThingShadow();
          this.thingShadows.emit('delta', 'theThingName', 'theStateObject');
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Replace thingShadow with all its events initThingShadow() references with an EventEmitter
      sandbox.stub(awsIot, 'thingShadow').returns(new EventEmitter());

      // Watch for console.log on void returns
      sandbox.spy(console, 'log');

      // will initialize and trigger the thingShadow event that should trigger method we want called.
      dataUploader.testInitThingShadow();

      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('received delta on theThingName: "theStateObject"')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });

  it("should log on timeout for troubleshooting purposes", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        public testInitThingShadow = () => {
          this.initThingShadow();
          this.thingShadows.emit('timeout', 'theThingName', 'theClientToken');
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Replace thingShadow with all its events initThingShadow() references with an EventEmitter
      sandbox.stub(awsIot, 'thingShadow').returns(new EventEmitter());

      // Watch for console.log on void returns
      sandbox.spy(console, 'log');

      // will initialize and trigger the thingShadow event that should trigger method we want called.
      dataUploader.testInitThingShadow();

      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('timeout for theThingName: theClientToken')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });
});

xdescribe("DataUploader: subscribeToMqttTopic", () => {
  it("should subscribe to MQTT topic", () => {
    
  });
});


describe("DataUploader: createUniqueClientId", () => {
  it("should create a unique client id", () => {
    class TestDataUploader extends DataUploader {
      public testCreateUniqueClientId = (): string => {
        return this.createUniqueClientId();
      }
    }
    const dataUploader = new TestDataUploader(dataUploaderOptions);

    const uniqueClientId = dataUploader.testCreateUniqueClientId();

    expect(uniqueClientId).to.contain('camera');
    expect(uniqueClientId.length).to.equal(43);
  });
});

xdescribe("DataUploader: requestSignedUrls", () => {
  it("should request signed urls via publishing to MQTT topic", () => {
    
  });
});

xdescribe("DataUploader: processUploadStack", () => {
  it("should", () => {
    //
  });
});

describe("DataUploader: getUploadUrl", () => {
  it("should return a signed url immediately if one is available", async () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        protected discardExpiredSignedUrls = () => {
          console.log('discardExpiredSignedUrls() called');
        }

        protected topOffSignedUrls = () => {
          console.log('topOffSignedUrls() called');
        }
        
        public testGetUploadUrl = async (): Promise<string> => {
          this.signedUrls = ['https://some-url.com'];
          return await this.getUploadUrl();
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Watch for console.log on void returns
      sandbox.spy(console, 'log');

      const url = await dataUploader.testGetUploadUrl();

      expect(url.length > 0);
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('discardExpiredSignedUrls() called')).to.be.true;
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('topOffSignedUrls() called')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });

  it("should wait X intervals, then force topOffSignedUrls() and continue to wait for url if there are 0 signed urls remaining", async () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        // Greatly reduce retry time for unit test
        protected getUploadUrlTimeoutRetry = 1;
        
        protected discardExpiredSignedUrls = () => {
          // skip
        }

        protected topOffSignedUrls = (force?: boolean): void => {
          if (force) {
            console.log('topOffSignedUrls() called with force');
            this.signedUrls = ['https://some-url.com'];
          }
        }
        
        public testGetUploadUrl = async (): Promise<string> => {
          this.signedUrls = [];
          return await this.getUploadUrl();
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Watch for console.log on void returns
      sandbox.spy(console, 'log');

      const url = await dataUploader.testGetUploadUrl();

      expect(url.length > 0);
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('Waiting for requested signed URLs...')).to.be.true;
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('topOffSignedUrls() called with force')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });
});

describe("DataUploader: topOffSignedUrls", () => {
  it("should request more urls if there are 5 urls remaining for use", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        protected requestSignedUrls = (urlCount: number, sendTo: string): void => {
          console.log('requestSignedUrls() called');
        }
        
        public testTopOffSignedUrls = (signedUrls: string[]) => {
          this.signedUrls = signedUrls;
          this.topOffSignedUrls(false);
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Watch for console.log on void returns
      sandbox.spy(console, 'log');

      const sixSignedUrls = ['1', '2', '3', '4', '5', '6']; // false
      const fourSignedUrls = ['1', '2', '3', '4']; // false
      const fiveSignedUrls = ['1', '2', '3', '4', '5']; // true

      dataUploader.testTopOffSignedUrls(sixSignedUrls);
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('requestSignedUrls() called')).to.be.false;

      dataUploader.testTopOffSignedUrls(fourSignedUrls);
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('requestSignedUrls() called')).to.be.false;

      dataUploader.testTopOffSignedUrls(fiveSignedUrls);
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('requestSignedUrls() called')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });

  it("should request more urls if force is set to true", () => {
    const sandbox = sinon.createSandbox();
    try {
      class TestDataUploader extends DataUploader {
        protected requestSignedUrls = (urlCount: number, sendTo: string): void => {
          console.log('requestSignedUrls() called');
        }
        
        public testTopOffSignedUrls = () => {
          this.topOffSignedUrls(true);
        }
      }
      const dataUploader = new TestDataUploader(dataUploaderOptions);

      // Watch for console.log on void returns
      sandbox.spy(console, 'log');

      dataUploader.testTopOffSignedUrls();
      // @ts-ignore: Unreachable code error
      expect(console.log.calledWith('requestSignedUrls() called')).to.be.true;
    } finally {
      sandbox.restore();
    }
  });
});

describe("DataUploader: getExpireDateFromSignedUrl", () => {
  it("should get the ttl date from a signed url", () => {
    class TestDataUploader extends DataUploader {
      public testGetExpireDateFromSignedUrl = (url: string): Date => {
        return this.getExpireDateFromSignedUrl(url);
      }
    }
    const dataUploader = new TestDataUploader(dataUploaderOptions);

    // Amazon returns signed urls with an expiration date included in the URL.
    const url = 'https://some-bucket.s3.amazonaws.com/288be7c1-4ab3-4511-a518-de62190d387f.jpg?AWSAccessKeyId=ASIAZGGAUDZWHB2TIA45&Content-Encoding=base64&Content-Type=image%2Fjpeg&Expires=1588357253&Signature=NGjHbnp7%2BakbJoFLz9UX%2BCQBPBQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEPr%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCFioIShsXC4henFR%2FsqSz4%2BlbMO5SsLZn8Z1mQc1WiQgIgb8cdDKupFl8497HE7iECrYetQXozVeuOzsWvzRk%2BaD4q5gEIMxAAGgw2MzE3NjQxNjQyMDQiDCTbOZTwnwZQRZxNTyrDAdVUCXI5275xAaQakwFjWzxOVDwJTlz8bVRaqrEwKdBhe64ZrQl1SMfDA77uTHcM%2Fdq11KvaB9YgXBeEWTzczrVa9zl%2B3RQuhDUc0gwvcfss8OoCHnloLI%2FoyoNoazS9q4jdrcGTSsMUZr3BQHS5pfCHAcnVzK5WABIjub2KZ2MFyfvs8zYu7Jtp3C5lfiZGJF8F0FxZTrVXH5KEWOSPZLMZ19HMFP0eeQUyd%2BbzuBuaS%2BoJ8uZimLwQHTPTOmzN9s7gjjDDwrH1BTrgAZnuMcqpSHGo2eBM3n64UJlMFrm7n6zAVOHpIW3mao1CV0neqMzt%2FdZNDZ%2F3WFMjtf7wVDUcKqEFD5xsO%2B4gPM0AUmf22rt69jk9WxHFV%2B%2BAH%2FFZqYKf93Ux1KJuVStMnLZLQxKURUkf3bgEAVZMSy%2BS6u5Fricoeqt7tp4Jx1BOLk%2FPNAB98WSgm823tFUeJ%2F4snyiPGUsjV9PErUXt5YmY3VPOXw%2FoqZNx0hgUwwJA39AJ%2F%2Fi6xWaWeyXpdNsbrhz6GEednHIODm6fThQINPB2QxlXuMuwXiS5qH0ezDn%2F';
    const ttlDate = dataUploader.testGetExpireDateFromSignedUrl(url);
    // Expecting the URL TTL minus 5 seconds
    const expectedDate = new Date((1588357253 * 1000) - 5000);
    expect(ttlDate.getTime()).to.equal(expectedDate.getTime());
  });
});

describe("DataUploader: discardExpiredSignedUrls", () => {
  it("should remove signed urls that have expired", () => {
    class TestDataUploader extends DataUploader {
      public testDiscardExpiredSignedUrls = (testUrls: string[]): string[] => {
        this.signedUrls = testUrls;
        this.discardExpiredSignedUrls();
        return this.signedUrls;
      }
    }
    const dataUploader = new TestDataUploader(dataUploaderOptions);

    const now = new Date();
    // Add 6 seconds as URLs that expire in 5 seconds are considered expired now
    // to help ensure it won't expire before use.
    const nowTimestamp = Math.floor((now.getTime() + 6000) * 0.001); // epoch timestamp
    // Current time expired 5 minutes ago. One could also subtract time here for same results.
    const expiredTimestamp = Math.floor(now.getTime() * 0.001); // epoch timestamp
    const testUrls = [
      `https://some-bucket.s3.amazonaws.com/some-file.jpg?Expires=${nowTimestamp}&Signature=123`,
      `https://some-bucket.s3.amazonaws.com/some-file.jpg?Expires=${expiredTimestamp}&Signature=123` // an old one to be removed
    ];

    const resultUrls = dataUploader.testDiscardExpiredSignedUrls(testUrls);

    expect(resultUrls.length).to.equal(1);
  });
});

describe("DataUploader: addToUploadImageStack", () => {
  it("should add image to upload image stack (public method)", () => {
    class TestDataUploader extends DataUploader {
      public testCheckImageStackIsEmpty = (): boolean => {
        return this.uploadImageStack.isEmpty();
      }
    }
    const dataUploader = new TestDataUploader(dataUploaderOptions);

    dataUploader.addToUploadImageStack('/some/file.jpg');
    const isImageStackEmpty = dataUploader.testCheckImageStackIsEmpty();
    expect(isImageStackEmpty).to.be.false;
  });
});

xdescribe("DataUploader: uploadImage", () => {
  it("should", () => {
    //
  });
});