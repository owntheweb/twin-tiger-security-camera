# Twin Tiger Security Camera

[![Maintainability](https://api.codeclimate.com/v1/badges/8a647bf45581fb211afe/maintainability)](https://codeclimate.com/github/owntheweb/twin-tiger-security-camera/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/8a647bf45581fb211afe/test_coverage)](https://codeclimate.com/github/owntheweb/twin-tiger-security-camera/test_coverage)

![Twin Tiger Security Badge](./img/twin-tiger-security.png)

Twin Tiger Security is an affordable, scalable security camera solution that runs on Raspberry Pi Zero and Amazon Web Services (AWS). Camera software is quickly deployed to camera(s) and managed/monitored via [balenaCloud](https://balena.io). Serverless configuration and services are deployed to AWS via [AWS Amplify](https://aws.amazon.com/amplify/).

## Features

- Takes high resolution images and uploads to the cloud.
- Includes motion detection with one or more bounding boxes, identifying motion within specified areas of an image.
- For the current MVP release, sends new images to a [slack](https://slack.com/) channel for quick viewing.
- Supports multiple cameras.
- Tested with [Raspberry Pi Zero W NoIR Camera Pack](https://www.adafruit.com/product/3415).
- Pi software installed, deployed and monitored with [balenaCloud](https://balena.io).
- Online serverless hosting and services configured and deployed with [AWS Amplify](https://aws.amazon.com/amplify/).

## Minimal Viable Product (MVP) Release

The current release sends all motion-detected images from all cameras to a single slack channel called #twin-tiger via a slack app, for the same AWS account. Lots of testing and tweaks are underway. Give the project a shot and also be sure to submit any issues at this early stage.

## Upcoming Features

A user UI is planned as part of AWS Amplify use. A few features planned include:

- Additional metadata logged to DynamoDB for correct sorting and search of images for multiple cameras.
- "LIVE" view for each camera (near-live, latest image)
- User authentication
- View camera online status.
- Browse images by camera.
- Browse images by time range.
- Image share feature using temporary signed URLs.
- Users given access to specific cameras
- Camera configuration updates via UI (currently only via environment variables)
- Experimental: Gather additional image metadata using [TensorFlow.js](https://www.tensorflow.org/js) (if it doesn't make it run slow or hot)

## Story

Twin Tiger Security is named after two vicious "tigers" (tabby cats) at the time of an attempted burglary. After breaking in the front door, the two cats ran up the stairs, sounding like a herd of elephants (not the most graceful tabby cats). It was dark, resulting in the crook grabbing a purse then quickly exiting, luckily just a bag of receipts. This triggered a homemade security camera effort on a low budget and effort to practice writing better code.

"Version 1" was just a setup on a Raspberry Pi directly that uploaded images to AWS S3, triggering images being sent to slack. It worked great and was reliable. However, images were very delayed and it just didn't scale. The Pi was difficult the setup, requiring many steps.

This current effort dockerizes and deploys through [balena.io](https://balena.io). A UI/backend is being created via AWS Amplify (posted soon after a bit more work here). Feel free to follow along and/or contribute. :D

## Getting Started

### Obtain Hardware

This solution was tested using a [Raspberry Pi Zero W NoIR Camera Pack](https://www.adafruit.com/product/3415). One could also try it out on a Raspberry Pi 3B+ or Pi 4 with NoIR or regular 8MP Pi camera.

### Clone the Repository

```
git clone https://github.com/owntheweb/twin-tiger-security-camera.git
```

### Setup Slack Incoming Webhook

<details>
  <summary>Expand</summary>

  While a UI is planned, the initial MVP release supports sending all camera images where motion was detected to a slack channel. For that to work, a slack app will need to be created.

  Create a slack account if needed.

  Create or choose a workspace and create a channel called #twin-tiger.

  Create a [slack app](https://api.slack.com/apps/new).

  Choose an app name and workspace.

  In the app settings page, select **Incoming Webhooks** and click the Activate Incoming Webhooks toggle to switch it **on**. Additional options will appear.

  Click the **Add New Webhook to Workspace** button, select the **#twin-tiger** channel, then click the **Authorize** button.

  Under **Webhook URLs for Your Workspace**, copy the URL that looks like this for later use when setting up AWS:
  ```
  https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
  ```
</details>

### Setup AWS Backend with Amplify

<details>
  <summary>Expand</summary>

  An AWS Account will be required. [Create an AWS Account](https://portal.aws.amazon.com/billing/signup).

  Install [Node.js](https://nodejs.org/) if needed.

  Follow [Prerequisites instructions on the AWS Amplify website](https://docs.amplify.aws/start/getting-started/installation/q/integration/js) to setup Amplify CLI and an IAM User.

  Move to the amplify directory.
  ```
  cd amplify
  ```

  Initialize a new backend environment.
  ```
  amplify init
  ```

  In setting up the environment settings, the following will be prompted (most defaults can be used):
  ```
  Enter a name for the project (twin-tiger-security)

  # All AWS services you provision for your app are grouped into an "environment"
  # A common naming convention is dev, staging, and production
  Enter a name for the environment (dev)

  # Sometimes the CLI will prompt you to edit a file, it will use this editor to open those files.
  Choose your default editor

  # Amplify supports JavaScript (Web & React Native), iOS, and Android apps
  Choose the type of app that you're building (javascript)

  What JavaScript framework are you using (none)

  Source directory path (src)

  Distribution directory path (dist)

  Build command (npm run-script build)

  Start command (npm run-script start)

  # This is the profile you created with the `amplify configure` command in the Prerequisites instructions.
  Do you want to use an AWS profile
  ```

  AWS services have been pre-configured via CloudFormation templates (auto-generated by Amplify then tweaked as needed) including:

  - S3 bucket to store images, file expiration of one month (to save on costs long-term)
  - Lambda function for cameras to request S3 signed URLs for secure uploads
  - Lambda function to send new camera images to a slack channel
  - Lambda function to add new Cognito users to an authentication group (not implemented yet, in progress)
  - Authentication using AWS Cognito (not implemented yet, in progress)

  To push these services as part of the currently active environment (example: 'dev'):

  ```
  amplify push
  ```

  This may take a few minutes.

  Once services are pushed, there's one manual change that will need to be made in the AWS console to make the MVP release work: adding the slack channel webhook as an environment variable for the `twinTigerSecurityTriggerS3` Lambda function.

  Visit [Lambda in the AWS Console](https://console.aws.amazon.com/lambda/home).

  Click on **twinTigerSecurityTriggerS3-[YOUR_ENV]**.

  Scroll down to **Environment variables** and choose **Edit**.

  Choose **Add environment variable** and add an environment variable of **SLACK_WEBHOOK** with the value containing the slack app webhook url created earlier.

  Choose **SAVE** at the bottom.

  AWS configuration is complete (🎉 congrats).

  When making updates in the future, the following will prompt a confirmation with a list services will be updated.
  ```
  amplify push
  ```
</details>

### Setup Camera Connections with AWS IoT Core

<details>
  <summary>Expand</summary>

  The security cameras will securely request and receive signed URLs for image uploads via MQTT topics. Eventually, they'll also get user preference updates such as image orientation and resolution settings via a "thing shadow" that keeps the current device state and desired state. This happens via AWS IoT Core as registered "things".

  To connect a new thing to AWS, visit [AWS Iot Core](https://console.aws.amazon.com/iot/home?region=us-east-1#/).

  Choose **Manage** -> **Things** in the left menu, then click the **Create** button on the top-right.

  Choose **Create a single thing**.

  Give the security camera a name. Note that this will not be able to be changed after creation.

  Optionally, create and select a type for Twin Tiger Security cameras. This adds a common set of attributes to security cameras that can be used to better manage many cameras or many types of things (ignore if not scaling).

  On the next screen, choose **Create certificate** under **One-click certificate creation (recommended)**.

  Next, it's important to download the three certificates listed. The public certificate won't be used in this project yet, however may come into play when setting up users with UI access to specific cameras in the future. These will be used when setting up the camera hardware for install and monitoring in balena.io later.

  Also, download the [Amazon Root CA 1 certificate found here](https://docs.aws.amazon.com/iot/latest/developerguide/server-authentication.html#server-authentication-certs).

  Choose **Activate**, then **Attach Policy** at the bottom right.

  Select **iot-twin-tiger-security-camera**

  Finish setting up IoT for the device by choosing **Register Thing**.

  For an additional visual guide covering most steps, see [the balena.io website](https://www.balena.io/docs/learn/develop/integrations/aws/).
</details>

### Setup balenaCloud Application

<details>
  <summary>Expand</summary>

  ***TODO: Can I add a quick creation button like belana-dash has?***

  Setup a [belana.io account](https://dashboard.balena-cloud.com/signup).

  On the [Applications dashboard](https://dashboard.balena-cloud.com/apps), choose **Create application**.

  In the modal window, set an Application Name and choose the device type, `Raspberry Pi (v1 / Zero / Zero W)` for example, then choose **Create new application**.

  Before adding a device, the camera fleet will be configured with defaults that will apply to all camera devices. Select **Fleet configuration** on the left navigation.

  Under **Define device GPU memory in megabytes.**, set a value of **128**.

  Under CUSTOM CONFIGURATION VARIABLES, choose **+ Add custom variable**. Add a variable of **RESIN_HOST_CONFIG_start_x** with a value of **1**, then choose **Add**.

  Select environment variables to the left. Add the following environment variables and values that serves as default camera device configuration.

  | Environment Variable | Value | Description |
  | --- | --- | --- |
  | AWS_ENDPOINT | (your AWS IoT endpoint goes here) | Fill this in with the AWS IoT endpoint found on the [IoT Core Settings page](https://console.aws.amazon.com/iot/home#settings). |
  | AWS_IMAGE_BUCKET | (your environment S3 bucket name) | Check S3 for a bucket named similar to twin-tiger-security-camera-imagesXXXXX-dev ('dev' will be the AWS Amplify environment name) |
  | AWS_PRIVATE_CERT | INDIVIDUAL_DEVICE_CERT_GOES_HERE | Leave this and override when setting up individual devices. |
  | AWS_REGION | (your AWS region) | Specify the region where IoT and Lambda functions live e.g. `us-east-1` |
  | AWS_ROOT_CERT | INDIVIDUAL_DEVICE_CERT_GOES_HERE | Leave this and override when setting up individual devices. |
  | AWS_THING_CERT | INDIVIDUAL_DEVICE_CERT_GOES_HERE | Leave this and override when setting up individual devices. |
  | IMAGE_HEIGHT | 1080 | Available camera image height as [supported by raspistill](https://www.raspberrypi.org/documentation/raspbian/applications/camera.md) (see 'Version 1.x' and 'Version 2.x' depending on Pi camera version used). |
  | IMAGE_QUALITY | 75 | JPG quality between 0 - 100 |
  | IMAGE_ROTATION | 0 | 0, 90, 180, 270, depending on camera orientation, 0 by default |
  | IMAGE_WIDTH | 1920 | Available camera image width as [supported by raspistill](https://www.raspberrypi.org/documentation/raspbian/applications/camera.md) (see 'Version 1.x' and 'Version 2.x' depending on Pi camera version used). Choose an option that pairs with IMAGE_HEIGHT. |
  | MOTION_HOTSPOTS | 0,0,100,100 | By default, use one motion sensing hotspot bounding box that covers 100% of the image. |
  | MOTION_SENSITIVITY | 30 | A value from 0 to 100, representing percent change between pixel values that trigger motion detection. Too low of a value will pick up on noise and all images will be captured. Too high and motion may not be detected while motion is happening. 20-30 is a sensible default. |
  | THUMB_HEIGHT | 16 | Pixel height of embedded thumbnail used for motion detection (instead of loading the whole image, CPU saver) |
  | THUMB_WIDTH | 20 | Pixel width of embedded thumbnail used for motion detection |
</details>

### Setup belenaCloud Security Camera Devices

Writing this up now...

### Enjoy

Enjoy!
