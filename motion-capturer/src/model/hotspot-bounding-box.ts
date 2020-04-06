export interface HotspotBoundingBox {
  // Pixel bounding box starts from top of image e.g. 10 for 10%
  top: number;
  
  // Pixel bounding box starts from left of image
  left: number;
  
  // Pixel width of image bounding box extends
  width: number;

  // Pixel height of image bounding box extends
  height: number;
}
