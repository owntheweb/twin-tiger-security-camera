// See: https://www.raspberrypi.org/documentation/raspbian/applications/camera.md

export enum RaspistillExposure {
  'AUTO' = 'auto', // use automatic exposure mode
  'NIGHT' = 'night', // select setting for night shooting
  'NIGHT_PREVIEW' = 'nightpreview', // no description
  'BACKLIGHT' = 'backlight', // select setting for backlit subject
  'SPOTLIGHT' = 'spotlight', // no description
  'SPORTS' = 'sports', // select setting for sports (fast shutter etc.)
  'SNOW' = 'snow', // select setting optimized for snowy scenery
  'BEACH' = 'beach', // select setting optimized for beach
  'VERY_LONG' = 'verylong', // select setting for long exposures
  'FIXED_FPS' = 'fixedfps', // constrain fps to a fixed value
  'ANTI_SHAKE' = 'antishake', // antishake mode
  'FIREWORKS' = 'fireworks' // select setting optimized for fireworks
}