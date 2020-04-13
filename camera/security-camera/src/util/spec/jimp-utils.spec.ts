import sinon from 'sinon';
import child_process from 'child_process';
import stream from 'stream';
import events from 'events';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import Jimp from 'jimp';
import { JimpUtils } from '../jimp-utils';

describe("JimpUtils: getPixelRgbDistanceRatio", () => {
  it("should return 1.0 if measuring the distance ratio from full black to full white", () => {
      const image1 = new Jimp(1, 1, 0x000000FF);
      const image2 = new Jimp(1, 1, 0xFFFFFFFF);
      const distance = JimpUtils.getPixelRgbDistanceRatio(image1, image2, 0, 0);
      expect(distance).to.equal(1.0);
  });

  it("should return 0.0 if measuring the distance ratio from full black to full black", () => {
    const image1 = new Jimp(1, 1, 0x000000FF);
    const image2 = new Jimp(1, 1, 0x000000FF);
    const distance = JimpUtils.getPixelRgbDistanceRatio(image1, image2, 0, 0);
    expect(distance).to.equal(0.0);
  });
});

describe("JimpUtils: loadImage", () => {
  it("should return a Jimp image for provided file path", async () => {
    const sandbox = sinon.createSandbox();
    try {
      // Stub Jimp.read with a 1px test image.
      const readResolves = new Jimp(1, 1, 0x000000FF);
      sandbox.stub(Jimp, 'read')
          .resolves(readResolves);

      const thumb = await JimpUtils.loadImage('/some-dir/some-thumb.jpg');

      // Test that one can call a method on a Jimp image.
      expect(thumb.getPixelColor(0, 0)).to.equal(255);
    } finally {
      sandbox.restore();
    }
  });

  it("should throw an error on unsuccessful Jimp.read()", async () => {
    const sandbox = sinon.createSandbox();
    try {
      /// Stub Jimp.read with a fail.
      sandbox.stub(Jimp, 'read')
          .rejects('Uh oh!');

      // Should throw an error:
      const thumb = await JimpUtils.loadImage('/some-dir/some-thumb.jpg');
    } catch (err) {
      expect(err.message).to.equal('Unable to load image');
    } finally {
      sandbox.restore();
    }
  });
});