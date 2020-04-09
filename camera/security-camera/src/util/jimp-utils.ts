/**
 * Utils for handling motion hotspot bounding boxes used for motion detection in images.
 */

import Jimp from 'jimp';

export class JimpUtils {
  
  /**
   * Get the RGB distance of two images for a given pixel, used for pixel comparison.
   * @param image1 - first image to use for pixel "distance"
   * @param image2 - second image of equal width/height of image1 to use for pixel "distance"
   * @param pixelX - x coordinate in pixels to read in both images
   * @param pixelY - y coordinate in pixels to read in both images
   */
  public static getPixelRgbDistanceRatio = (image1: Jimp, image2: Jimp, pixelX: number, pixelY: number) => {
    // Set a max distance value to use as a multiplier.
    // Math.sqrt(Math.pow(255,2) + Math.pow(255,2) + Math.pow(255,2))
    const maxDistance = 441.6729559300637;
    
    // Get RGB values from both images at the same pixel x/y
    const image1Rgb = Jimp.intToRGBA(image1.getPixelColor(pixelX, pixelY));
    const image2Rgb = Jimp.intToRGBA(image2.getPixelColor(pixelX, pixelY));
    const distance = Math.sqrt(
      Math.pow(image1Rgb.r - image2Rgb.r, 2) + 
      Math.pow(image1Rgb.g - image2Rgb.g, 2) + 
      Math.pow(image1Rgb.b - image2Rgb.b, 2)
    );

    return distance === 0 ? 0 : (distance / maxDistance);
  }

  /**
   * Load an image file and return as a Jimp class image that can be used in Node.
   * @param imagePath - full path to image file
   */
  public static loadImage = async (imagePath: string) => {
    try {
      return await Jimp.read(imagePath);
    } catch (err) {
      console.log('loadImage error', err);
      throw new Error('Unable to load image');
    }
  }
}