# Twin Tiger Security Camera

![Twin Tiger Security Badge](./img/twin-tiger-security.png)

Twin Tiger Security is a project named after two vicious "tigers" (tabby cats) at the time of an attempted burglary. After breaking in the front door, the two cats ran up the stairs, sounding like a herd of elephants (not the most graceful tabby cats). It was dark, resulting in the crook grabbing a purse then quickly exiting, luckily just a bag of receipts. This triggered a homemade security camera effort on a low budget and effort to practice writing better code.

## Work In Progress

"Version 1" was just a setup on a Raspberry Pi directly that uploaded images to AWS S3, triggering images being sent to slack. It worked great and was reliable. However, images were very delayed and it just didn't scale well. The Pi was difficult the setup, requiring many steps.

This current effort dockerizes and deploys through [balena.io](https://balena.io). A UI/backend is being created via AWS Amplify (posted soon after a bit more work here). Feel free to follow along and/or contribute. :D

## Components

### Security Camera

The camera runs on a Raspery Pi Zero Wireless or Pi 3B+ with compatible Pi Cam attached. It's deployed to one or more devices via balena.io for secure and efficient updates and device monitoring. The software is made up of two services running in Docker containers:

#### Raspistill Manager

This is a Node.js service that manages Raspbian's raspistill program that captures images. It balances taking rapid photos with updating lighting settings. It also clears out old images stored in the temporary RAM drive, designed to not burn out the MicroSD card when taking pictures constantly 24x7.

#### Motion Capturer

This Node.js service listens for new captured images, compares embedded thumbnails to quickly detect motion and moves qualified images to less temporary storage for upload. It obtains temporary/signed URLs as needed via AWS IoT/AWS Lambda and securely uploads images to AWS S3.

### AWS Amplify Serverless Architecture and UI

[AWS Amplify](https://aws.amazon.com/amplify/) is being used to rapidly setup the serverless stack with web application UI assistance. The Amplify CLI offers several methods for configuring services as code. It also quickly hooks into popular UI frameworks for authentication, GraphQL API calls and other tasks. This is currently still at an early stage for this project while working out the camera basics.

## Hot Topics Today

- AWS IoT image uploads to S3 (via signed URL/https post)
- This project is designed to measure current development skills and stretch the mind. I feel the need to understand unit testing in regards to TypeScript specifically (love mocha/chai, use of classes with private methods feeling in the way of this), revisit Functional Programming and compare with Angular habits (which can be FP of course) and revisit use of classes in general. I'm open to a refactor and feedback!
- How-To docs once this is up and running.
- The next project, an engaging and interesting UI/backend using AWS Amplify and React or Angular.
