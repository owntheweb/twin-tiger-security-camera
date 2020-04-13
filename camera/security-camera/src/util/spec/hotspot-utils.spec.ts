import { describe, it } from 'mocha';
import { expect } from 'chai';
import { HotspotUtils } from '../hotspot-utils';
import { HotspotBoundingBox } from '../../model/hotspot-bounding-box';

describe("HotspotUtils: hotspotPercentToPixels", () => {
  it("should convert hotspot percentage position or width to pixel equivalent", () => {
    const testSets = [
      {
        hotspotWidthPercent: 100,
        fullWidthPixels: 30,
        expectedResult: 30
      },
      {
        hotspotWidthPercent: 50,
        fullWidthPixels: 30,
        expectedResult: 15
      },
      {
        hotspotWidthPercent: 10,
        fullWidthPixels: 30,
        expectedResult: 3
      }
    ];

    for (const testSet of testSets) {
      const result = HotspotUtils.hotspotPercentToPixels(testSet.hotspotWidthPercent, testSet.fullWidthPixels);
      expect(result).to.equal(testSet.expectedResult);
    }
  });
});

describe("HotspotUtils: hotspotIsValid", () => {
  it("should return true if provided motion sensing hotspot is valid", () => {
    const imageWidth = 100;
    const imageHeight = 100;
    const testSets = [
      {
        top: 0,
        left: 0,
        width: 100,
        height: 100
      },
      {
        top: 20,
        left: 20,
        width: 60,
        height: 60
      },
      {
        top: 90,
        left: 90,
        width: 10,
        height: 10
      }
    ];

    for (const testSet of testSets) {
      const hotspot: HotspotBoundingBox = testSet;
      const result = HotspotUtils.hotspotIsValid(hotspot, imageWidth, imageHeight);
      expect(result).to.be.true;
    }
  });

  it("should return false if provided motion sensing hotspot is invalid", () => {
    const imageWidth = 100;
    const imageHeight = 100;
    const testSets = [
      {
        top: -1,
        left: 0,
        width: 100,
        height: 100
      },
      {
        top: 0,
        left: -1,
        width: 100,
        height: 100
      },
      {
        top: 0,
        left: 0,
        width: 101,
        height: 100
      },
      {
        top: 0,
        left: 0,
        width: 100,
        height: 101
      },
      {
        top: 0,
        left: 0,
        width: 0,
        height: 100
      },
      {
        top: 0,
        left: 0,
        width: 100,
        height: 0
      },
      {
        top: 1, // = 101
        left: 0,
        width: 100,
        height: 100
      },
      {
        top: 0,
        left: 1, // = 101
        width: 100,
        height: 100
      },
    ];

    for (const testSet of testSets) {
      const hotspot: HotspotBoundingBox = testSet;
      const result = HotspotUtils.hotspotIsValid(hotspot, imageWidth, imageHeight);
      expect(result).to.be.false;
    }
  });
});

// TODO: Determine if it's ok to call upon other static methods in this method
// and not stub. It was felt that this is ok for this test as it confirms
// desired behavior and doesn't cause side effects.
describe("HotspotUtils: getHotspotsFromString", () => {
  it("should convert valid hotspot string (e.g. provided as environment variable) into HotspotBoundingBox[]", () => {
    const imageWidth = 100;
    const imageHeight = 100;
    const testSets = [
      '0,0,100,100',
      '25,25,50,50|85,0,15,100'
    ];

    for (const testSet of testSets) {
      const result = HotspotUtils.getHotspotsFromString(testSet, imageWidth, imageHeight);
      expect(result).to.be.an('array');
      expect(result.length).to.be.above(0);
    }
  });

  it("should return an empty array if hotspot string is invalid", () => {
    const imageWidth = 100;
    const imageHeight = 100;
    const testSets = [
      '-1,0,100,100',
      '25,25,80,80|0,85,15,100' // second item valid, first not (still invalid as a whole, for defaulting to watching full image for motion)
    ];

    for (const testSet of testSets) {
      const result = HotspotUtils.getHotspotsFromString(testSet, imageWidth, imageHeight);
      expect(result).to.be.an('array');
      expect(result.length).to.equal(0);
    }
  });
});