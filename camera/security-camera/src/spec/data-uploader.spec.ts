import sinon from 'sinon';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { DataUploaderOptions } from '../model/data-uploader-options';
import { DataUploader } from '../data-uploader';
import { SignedUrl } from '../model/signed-url';

const dataUploaderOptions: DataUploaderOptions = {
  awsEndpoint: 'something.iot.us-east-1.amazonaws.com',
  awsPrivateCert: 'base64CertString',
  awsCaCert: 'base64CertString',
  awsThingCert: 'base64CertString',
  awsRegion: 'us-east-1',
  awsImageS3BucketName: 'someBucket',
  awsMqttClientId: 'aUniqueIdentifier12345'
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

xdescribe("DataUploader: initThingShadow", () => {
  it("should initialize the AWS IoT thing shadow", () => {
    //
  });
});

xdescribe("DataUploader: subscribeToMqttTopic", () => {
  it("should subscribe to MQTT topic", () => {
    //
  });
});

xdescribe("DataUploader: requestSignedUrls", () => {
  it("should request signed urls via publishing to MQTT topic", () => {
    //
  });
});

describe("DataUploader: combineNewSignedUrls", () => {
  it("should combine new signed urls with existing signed urls", () => {
    class TestDataUploader extends DataUploader {
      public testCombineNewSignedUrls = (newUrls: string[], existingUrls: SignedUrl[]) => {
        return this.combineNewSignedUrls(newUrls, existingUrls);
      }
    }
    const dataUploader = new TestDataUploader(dataUploaderOptions);
    
    // New URLs will come in as strings and will need estimated time to live added.
    const newUrls: string[] = [
      'https://new-url.com'
    ];

    // existing URLs will already 
    const existingUrls: SignedUrl[] = [
      {
        url: 'https://existing-url.com',
        ttl: new Date()
      }
    ];

    const combined = dataUploader.testCombineNewSignedUrls(newUrls, existingUrls);

    expect(combined.length).to.equal(2);
    expect(combined[0].url).to.equal(existingUrls[0].url);
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