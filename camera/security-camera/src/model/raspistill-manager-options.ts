export interface RaspistillManagerOptions {
  // directory where raspicam will save images
  imageDirectory?: string;

  // captured image width
  imageWidth?: number;
  
  // captured image height
  imageHeight?: number;
  
  // captured image jpg quality
  imageQuality?: number;
  
  // Rotation of the camera
  imageRotation?: number;

  // thumbnail capture width, part of image file used for quick motion detection vs. loading full image
  thumbWidth?: number;

  // thumbnail capture height, part of image file used for quick motion detection vs. loading full image
  thumbHeight?: number;

  // milliseconds between a short pause where camera determines optimal settings and begins taking pictures
  settingResetInterval?: number;
}