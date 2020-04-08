/**
 * Utils for handling motion hotspot bounding boxes used for motion detection in images.
 */

import { HotspotBoundingBox } from '../model/hotspot-bounding-box';

export class HotspotUtils {
  /**
   * Check if a parsed hotspot used for motion sensing is within bounds of thumbnail width/height.
   * @param hotspot - a hotspot to check if valid or not
   * @param imageWidth - width of image that hotspot will cover
   * @param imageHeight - height of image that hotspot will cover
   */
  public static hotspotIsValid = (hotspot: HotspotBoundingBox, imageWidth: number, imageHeight: number) => {
    const valid = hotspot.left >= 0 && hotspot.left <= imageWidth &&
        hotspot.top >= 0 && hotspot.top <= imageHeight &&
        hotspot.width > 0 && hotspot.width <= imageWidth &&
        hotspot.height > 0 && hotspot.height <= imageHeight &&
        hotspot.top + hotspot.height <= imageHeight &&
        hotspot.left + hotspot.width <= imageWidth;

    if (!valid) {
      console.error(`hotspotIsValid error: provided hotspot not valid for ${imageWidth}, ${imageHeight}`, hotspot);
    }
    return valid;
  }

  /**
   * Convert provided hotspot percent values to thumbnail pixels used in hotspot comparisons.
   * Example: width of 20% (20) on thumbnail option of 64px (64) wide would return rounded 13 pixels.
   */
  public static hotspotPercentToPixels = (percent: number, pixels: number) => Math.round((percent * 0.01) * pixels);

  /**
   * Parse environment variable hotspot string into an array of hotspots/boxes where motion will be detected.
   * Hotspots are handy if not wanting to capture constantly changing areas of an image e.g. a highway of cars
   * or a spot where tree leaf shadows cause motion detection with the slightest breeze.
   * Example input covering 100% of the image:
   * '0,0,100,100'
   * Example with two hotspots: a centered box and a top-to-bottom box aligned to the right:
   * '25,25,50,50|0,85,15,100'
   * @param hotspotString - string of hotspots from environment variable or config that needs parsed into array.
   * @param imageWidth - width of image that hotspot will cover
   * @param imageHeight - height of image that hotspot will cover
   * returns an array of hotspots
   */
  public static getHotspotsFromString = (hotspotString: string, imageWidth: number, imageHeight: number): HotspotBoundingBox[] => {
    // Break out into typed values.
    const boxStrings = hotspotString.split('|');
    const hotspots = boxStrings.map((boxString: string) => {
      const boxSplit = boxString.split(',');
      const hotspot: HotspotBoundingBox = {
        left: HotspotUtils.hotspotPercentToPixels(Number(boxSplit[0]), imageWidth),
        top: HotspotUtils.hotspotPercentToPixels(Number(boxSplit[1]), imageHeight),
        width: HotspotUtils.hotspotPercentToPixels(Number(boxSplit[2]), imageWidth),
        height: HotspotUtils.hotspotPercentToPixels(Number(boxSplit[3]), imageHeight)
      };
      return hotspot;
    })

    // Filter out anything not right.
    .filter((hotspot: HotspotBoundingBox) => HotspotUtils.hotspotIsValid(hotspot, imageWidth, imageHeight));

    // Set hotspots used when calculating motion detection.
    if (hotspots.length > 0) {
      return hotspots;
    }

    // return an empty array if no valid hotspots were found
    return [];
  }

}