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

Writing this up now...

### Setup balenaCloud Account and CLI

Writing this up now...

### Create and Download belenaCloud App

Writing this up now...

### Configure belenaCloud Devices

Writing this up now...

### Burn belanaCloud App To Disk

Writing this up now...

### Setup AWS Account and CLI

Writing this up now...

### Setup and Configure Services with AWS Amplify

Writing this up now...

### Enjoy

Enjoy!
