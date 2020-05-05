# Twin Tiger Security Camera

[![Maintainability](https://api.codeclimate.com/v1/badges/8a647bf45581fb211afe/maintainability)](https://codeclimate.com/github/owntheweb/twin-tiger-security-camera/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/8a647bf45581fb211afe/test_coverage)](https://codeclimate.com/github/owntheweb/twin-tiger-security-camera/test_coverage)

![Twin Tiger Security Badge](./img/twin-tiger-security.png)

Twin Tiger Security is an affordable, scalable security camera solution that runs on Raspberry Pi Zero and Amazon Web Services (AWS). Camera software is quickly deployed to camera(s) and managed/monitored via [balenaCloud](https://balena.io). Serverless configuration and services are deployed to AWS via [AWS Amplify](https://aws.amazon.com/amplify/).

## Features

- Takes high resolution images and uploads to the cloud.
- Includes motion detection with one or more bounding boxes, identifying motion within certain areas of an image.
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

### Setup Slack App

While a UI is planned, the initial MVP release supports sending all camera images where motion was detected to a slack channel. For that to work, a slack app will need to be created.

Writing this up now...

### Setup AWS Backend with Amplify

An AWS Account will be required. [Create an AWS Account](https://portal.aws.amazon.com/billing/signup).

Install [Node.js](https://nodejs.org/) if needed.

Follow [Prerequisites instructions on the AWS Amplify website](https://docs.amplify.aws/start/getting-started/installation/q/integration/js) to setup Amplify CLI and IAM User.

Move to the amplify directory.
```
cd amplify
```

Initialize a new backend environment.
```
amplify init
```

In setting up the environment settings, the following prompts will be (most defaults can be used):
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

AWS services have been pre-configured via CloudFormation templates (auto-generated by Amplify then tweaked as needed) for this project including:

- S3 bucket to store images, including access policies and file expiration of one month (to save on costs long-term)
- Lambda function for cameras to request S3 signed URLs for secure uploads
- Lambda function to send new camera images to a slack channel
- Lambda function to add new Cognito users to a authentication group (not implemented yet, in progress)
- Authentication using AWS Cognito (not implemented yet, in progress)

To push these services as part of the currently active environment (example: 'dev' if that was specified):

```
amplify push
```

This may take a few minutes.

Once services are pushed, there's one manual change that will need to be made in the AWS console to make the MVP release work: adding the slack channel webhook as an environment variable for the `twinTigerSecurityTriggerS3` Lambda function.

Visit [Lambda in the AWS Console](https://console.aws.amazon.com/lambda/home).

Click on **twinTigerSecurityTriggerS3-[YOUR_ENV]**.

Scroll down to **Environment variables** and choose **Edit**.

Choose the **Add environment variable** and add an environment variable of **SLACK_WEBHOOK** with the value containing the slack app webhook url created earlier.

Choose **SAVE** at the bottom.

With configuration completed (🎉 congrats), when making updates in the future, update with the following, which will prompt a confirmation of which services will be updated.
```
amplify push
```

### Setup balenaCloud Account and CLI

Writing this up now...

### Create and Download belenaCloud App

Writing this up now...

### Configure belenaCloud Devices

Writing this up now...

### Burn belanaCloud App To Disk

Writing this up now...

### Enjoy

Enjoy!
