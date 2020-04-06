# Twin Tiger Security Camera

![Twin Tiger Security Badge](./img/twin-tiger-security.png)

Twin Tiger Security is a project named after two vicious "tigers" (tabby cats) at the time of an attempted burglary. After breaking in the front door, the two cats ran up the stairs, sounding like a herd of elephants (not the most graceful tabby cats). It was dark, resulting in the crook grabbing a purse then quickly exiting, luckily just a bag of receipts. This triggered a homemade security camera effort on a low budget and effort to practice writing better code.

## Work In Progress

"Version 1" was just a setup on a Raspberry Pi directly that uploaded images to AWS S3, triggering images being sent to slack. It worked great and was reliable. However, images were very delayed and it just didn't scale well. The Pi was difficult the setup, requiring many steps.

This current effort dockerizes and deploys through [balena.io](https://balena.io). A UI/backend is being created via AWS Amplify (posted soon after a bit more work here). Feel free to follow along and/or contribute. :D

Hot topics today:

- AWS IoT image uploads to S3 (via signed URL/https post)
- This project is designed to measure current development skills and stretch the mind. I feel the need to understand unit testing in regards to TypeScript specifically (love mocha/chai, use of classes with private methods feeling in the way of this), revisit Functional Programming and compare with Angular habits (which can be FP of course) and revisit use of classes in general. I'm open to a refactor and feedback!
- How-To docs once this is up and running.
- The next project, an engaging and interesting UI/backend using AWS Amplify and React or Angular.

## Getting Started

TODO: This is still a work-in-progress. Once the initial setup is ready, this will require a Raspberry Pi Zero Wireless or 3B+, a balena.io account and an AWS account.
