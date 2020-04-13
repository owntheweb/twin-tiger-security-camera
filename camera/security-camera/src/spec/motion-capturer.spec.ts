import sinon from 'sinon';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { MotionCapturer } from '../motion-capturer';
import { MotionCapturerOptions } from '../model/motion-capturer-options';
import { CmdUtils } from '../util/cmd-utils';
import { JimpUtils } from '../util/jimp-utils';
import Jimp from 'jimp';
import { HotspotBoundingBox } from '../model/hotspot-bounding-box';
import { HotspotUtils } from '../util/hotspot-utils';

const motionCapturerOptions: MotionCapturerOptions = {
  awsEndpoint: 'abcd',
  awsPrivateCert: 'efg',
  awsRootCert: 'hijk',
  awsThingCert: 'lmnop',
  tempImageDirectory: '/image-temp',
  readyImageDirectory: '/image-ready',
  motionSensitivity: 20.0,
  motionHotspots: '0,0,100,100',
  dbRecordTtl: 30
};

// TODO: Confirm this is even needed or if there's better way to test.
describe("MotionCapturer: constructor", () => {
  it("should successfully initialize", () => {
    // with set options
    const motionCapturer = new MotionCapturer(motionCapturerOptions);
    expect(motionCapturer).to.not.be.null;
  });

  it("should throw an error if required AWS IoT credentials are not specified.", () => {
    // with set options
    const badMotionCapturerOptions: MotionCapturerOptions = {
      awsEndpoint: null,
      awsPrivateCert: null,
      awsRootCert: null,
      awsThingCert: null
    };
    try {
      const motionCapturer = new MotionCapturer(badMotionCapturerOptions);
      // fail
      expect(true).to.be.false;
    } catch (err) {
      expect(err.message).to.equal('MotionCapturer constructor: AWS IoT options are required.');
    }
    
  });
});

describe("MotionCapturer: getFileName", () => {
  it("should get the filename from a full file path", () => {
    // Extend class to call protected (yet public API) method
    class TestMotionCapturer extends MotionCapturer {
      public testGetFilename = (path: string) => {
        return this.getFileName(path);
      }
    }

    const path = '/full/path/to/file.jpg';
    const expectedFilename = 'file.jpg';
    const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);
    const resultFilename = testMotionCapturer.testGetFilename(path);

    expect(resultFilename).to.equal(expectedFilename);
  });
});

describe("MotionCapturer: saveFileForUpload", () => {
  it("should move file to another directory", async () => {
    const sandbox = sinon.createSandbox();
    try {

      // Extend class to call protected (yet public API) method
      class TestMotionCapturer extends MotionCapturer {
        public testSaveFileForUpload = async (filePath: string, movedFilePath: string) => {
          return await this.saveFileForUpload(filePath, movedFilePath);
        }
      }

      const moveFileStub = sandbox.stub(CmdUtils, 'moveFile').callsFake((filePath, movedFilePath) => {
        return Promise.resolve();
      });

      const filename = 'file.jpg';
      const moveFrom = `/start/${filename}`;
      const moveTo = '/destination/dir';
      const expectedReturnPath = `${moveTo}/${filename}`
      const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);
      const destinationPath = await testMotionCapturer.testSaveFileForUpload(moveFrom, moveTo);

      expect(moveFileStub.calledOnce).to.be.true;
      expect(destinationPath).to.equal(expectedReturnPath);
    } finally {
      sandbox.restore();
    }
  });

  it("should throw error if unable to move to another directory", async () => {
    const sandbox = sinon.createSandbox();
    try {

      // Extend class to call protected (yet public API) method
      class TestMotionCapturer extends MotionCapturer {
        public testSaveFileForUpload = async (filePath: string, movedFilePath: string) => {
          return await this.saveFileForUpload(filePath, movedFilePath);
        }
      }

      const moveFileStub = sandbox.stub(CmdUtils, 'moveFile').callsFake((filePath, movedFilePath) => {
        return Promise.reject('intentional-fail');
      });

      const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);

      try {
        // fail
        const destinationPath = await testMotionCapturer.testSaveFileForUpload('/some/file.jpg', '/some/destination');
        expect(true).to.be.false;
      } catch (err) {
        // pass
        expect(err.message).to.equal('Unable to move file file.jpg to /some/destination/file.jpg');
      }
    } finally {
      sandbox.restore();
    }
  });
});

// TODO: This one relies a lot on an external module single method with events
// Consider writing a test referencing spawnAsPromise, revisit.
xdescribe("MotionCapturer: watchCamImages", () => {
  it("should call upon watch module to watch for files", async () => {
    // TODO
  });
});

describe("MotionCapturer: extractThumbnailAsFile", () => {
  it("should extract an image embedded thumbnail (exif data), saving as a file", async () => {
    const sandbox = sinon.createSandbox();
    try {

      // Extend class to call protected (yet public API) method
      class TestMotionCapturer extends MotionCapturer {
        public testExtractThumbnailAsFile = async (imagePath: string, tempImageDir: string) => {
          return await this.extractThumbnailAsFile(imagePath, tempImageDir);
        }
      }

      const spawnStub = sandbox.stub(CmdUtils, 'spawnAsPromise').callsFake((command, args) => {
        return Promise.resolve('Ok!');
      });

      const filename = 'file.jpg';
      const extractFrom = `/start/${filename}`;
      const extractToDir = '/destination/dir';
      const extractedFilename = 'file-preview1.jpg'; // exiv2 determines this name, cannot get rid of '-preview'
      const expectedReturnPath = `${extractToDir}/${extractedFilename}`;
      const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);
      const destinationPath = await testMotionCapturer.testExtractThumbnailAsFile(extractFrom, extractToDir);

      expect(spawnStub.calledOnce).to.be.true;
      expect(destinationPath).to.equal(expectedReturnPath);
    } finally {
      sandbox.restore();
    }
  });

  it("should throw an error if thumbnail extraction fails.", async () => {
    const sandbox = sinon.createSandbox();
    try {

      // Extend class to call protected (yet public API) method
      class TestMotionCapturer extends MotionCapturer {
        public testExtractThumbnailAsFile = async (imagePath: string, tempImageDir: string) => {
          return await this.extractThumbnailAsFile(imagePath, tempImageDir);
        }
      }

      const spawnStub = sandbox.stub(CmdUtils, 'spawnAsPromise').callsFake((command, args) => {
        return Promise.reject('intentional fail');
      });

      const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);
      
      try {
        const destinationPath = await testMotionCapturer.testExtractThumbnailAsFile('/start/file.jpg', '/destination');
        // fail if it gets this far
        expect(true).to.be.false;
      } catch (err) {
        expect(err.message).to.equal('Unable to extract thumbnail as file');
      }
    } finally {
      sandbox.restore();
    }
  });
  
});

describe("MotionCapturer: detectMotion", () => {
  it("should detect motion comparing the previous thumbnail to the next", async () => {
    const sandbox = sinon.createSandbox();
    try {
      // Extend class to call protected (yet public API) method
      class TestMotionCapturer extends MotionCapturer {
        public testDetectMotion = (newThumb: Jimp, prevThumb: Jimp, hotspots: HotspotBoundingBox[], motionSensitivity: number) => {
          return this.detectMotion(newThumb, prevThumb, hotspots, motionSensitivity);
        }
      }
      
      const rgbDistanceStub = sandbox.stub(JimpUtils, 'getPixelRgbDistanceRatio').callsFake((image1, image2, pixelX, pixelY) => {
        return 0.5;
      });

      const thumb1 = new Jimp(1, 1, 0x000000FF);
      const thumb2 = new Jimp(1, 1, 0x999999FF);
      const hotspots: HotspotBoundingBox[] = [{
        top: 0,
        left: 0,
        width: 1,
        height: 1
      }];
      const motionSensitivity = 20;
      const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);
      const motionDetected = testMotionCapturer.testDetectMotion(thumb1, thumb2, hotspots, motionSensitivity);
      expect(rgbDistanceStub.calledOnce).to.be.true;
      expect(motionDetected).to.be.true;
    } finally {
      sandbox.restore();
    }
  });

  it("should not detect motion if thumbs are too similar", async () => {
    const sandbox = sinon.createSandbox();
    try {
      // Extend class to call protected (yet public API) method
      class TestMotionCapturer extends MotionCapturer {
        public testDetectMotion = (newThumb: Jimp, prevThumb: Jimp, hotspots: HotspotBoundingBox[], motionSensitivity: number) => {
          return this.detectMotion(newThumb, prevThumb, hotspots, motionSensitivity);
        }
      }
      
      const rgbDistanceStub = sandbox.stub(JimpUtils, 'getPixelRgbDistanceRatio').callsFake((image1, image2, pixelX, pixelY) => {
        return 0.19;
      });

      const thumb1 = new Jimp(1, 1, 0x000000FF);
      const thumb2 = new Jimp(1, 1, 0x111111FF);
      const hotspots: HotspotBoundingBox[] = [{
        top: 0,
        left: 0,
        width: 1,
        height: 1
      }];
      const motionSensitivity = 20;
      const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);
      const motionDetected = testMotionCapturer.testDetectMotion(thumb1, thumb2, hotspots, motionSensitivity);
      expect(rgbDistanceStub.calledOnce).to.be.true;
      expect(motionDetected).to.be.false;
    } finally {
      sandbox.restore();
    }
  });
});

describe("MotionCapturer: getThumbnail", () => {
  it("should load an extracted thumbnail from exif and return a Jimp image", async () => {
    const sandbox = sinon.createSandbox();
    try {
      // Extend class to call protected (yet public API) method
      class TestMotionCapturer extends MotionCapturer {
        // TODO: Figure out a way to stub this out for tracking. sinon is giving me errors with attempts.
        // For now, return a file path for extractThumbnailAsFile and continue.
        extractThumbnailAsFile = async (imagePath: string, tempImageDir: string): Promise<string> => {
          return Promise.resolve('/some/file.jpg');
        }
        
        public testGetThumbnail = async (imagePath: string): Promise<Jimp> => {
          return await this.getThumbnail(imagePath);
        }
      }
      
      const loadImageStub = sandbox.stub(JimpUtils, 'loadImage').callsFake(thumbPath => {
        return Promise.resolve(new Jimp(1, 1, 0x000000FF));
      });

      const imagePath = '/some/file.jpg';
      const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);
      const jimpImage = await testMotionCapturer.testGetThumbnail(imagePath);

      // get RGB values of a pixel (black) to confirm image was loaded.
      const pixelRgb = Jimp.intToRGBA(jimpImage.getPixelColor(0, 0));
      expect(pixelRgb.r).to.equal(0);
      
      expect(loadImageStub.calledOnce).to.be.true;
    } finally {
      sandbox.restore();
    }
  });
});

// TODO: Revisit this one. I was struggling to mock/stub same-class protected methods in TypeScript
xdescribe("MotionCapturer: processNewImageStack", () => {
  it("should process an image in the newImageStack", () => {
    
  });
});

describe("MotionCapturer: convertMotionHotspots", () => {
  it("should call getHotspotsFromString and return hotspot from string if valid", () => {
    const sandbox = sinon.createSandbox();
    try {
      // Extend class to call protected (yet public API) method
      class TestMotionCapturer extends MotionCapturer {
        public testConvertMotionHotspots = (hotspotString: string): HotspotBoundingBox[] => {
          return this.convertMotionHotspots(hotspotString);
        }
      }
      
      const getHotspotsStub = sandbox.stub(HotspotUtils, 'getHotspotsFromString').callsFake(hotspotString => {
        return [{
          left: 10,
          top: 10,
          width: 80,
          height: 80
        }];
      });

      const hotspotString = '10,10,80,80';
      const hotspotsResult = [{
        left: 10,
        top: 10,
        width: 80,
        height: 80
      }];
      const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);
      const hotspots: HotspotBoundingBox[] = testMotionCapturer.testConvertMotionHotspots(hotspotString);

      expect(getHotspotsStub.called).to.be.true;
      expect(hotspots[0].left).to.equal(hotspotsResult[0].left);
      expect(hotspots[0].top).to.equal(hotspotsResult[0].top);
      expect(hotspots[0].width).to.equal(hotspotsResult[0].width);
      expect(hotspots[0].height).to.equal(hotspotsResult[0].height);
    } finally {
      sandbox.restore();
    }
  });

  it("should call getHotspotsFromString and return default hotspot if provided string is invalid", () => {
    const sandbox = sinon.createSandbox();
    try {
      // Extend class to call protected (yet public API) method
      class TestMotionCapturer extends MotionCapturer {
        public testConvertMotionHotspots = (hotspotString: string): HotspotBoundingBox[] => {
          return this.convertMotionHotspots(hotspotString);
        }
      }
      
      const getHotspotsStub = sandbox.stub(HotspotUtils, 'getHotspotsFromString').callsFake(hotspotString => {
        // Pretend that the non-default string is not valid for now (returning [] and getting called again with default)...
        if (hotspotString != '0,0,100,100') {
          return [];
        }
        return [{
          left: 0,
          top: 0,
          width: 20,
          height: 16
        }];
      });

      // This will run over bottom and right by 10%, resulting in default being used instead.
      const hotspotString = '10,10,100,100';
      const hotspotsResult = [{
        left: 0,
        top: 0,
        width: 20,
        height: 16
      }];
      const testMotionCapturer = new TestMotionCapturer(motionCapturerOptions);
      const hotspots: HotspotBoundingBox[] = testMotionCapturer.testConvertMotionHotspots(hotspotString);

      expect(getHotspotsStub.called).to.be.true;
      expect(hotspots[0].left).to.equal(hotspotsResult[0].left);
      expect(hotspots[0].top).to.equal(hotspotsResult[0].top);
      expect(hotspots[0].width).to.equal(hotspotsResult[0].width);
      expect(hotspots[0].height).to.equal(hotspotsResult[0].height);
    } finally {
      sandbox.restore();
    }
  });
});

// TODO: Consider a better way to run. I don't really like the intervals here.
// This method also doesn't return anything. Keep catching up on design patterns.
xdescribe("MotionCapturer: run", () => {
  it("should", () => {
    
  });
});
