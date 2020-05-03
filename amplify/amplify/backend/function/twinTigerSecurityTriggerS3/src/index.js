require('dotenv').config()
const Slack = require('slack-node');
const util = require('util');
const AWS = require('aws-sdk');

/**
 * Get accelerated signed URLs
 * Note: Accelerated endpoints incur additional charges.
 */
const getSignedUrls = async (eventRecords) => {
  const s3 = new AWS.S3({
    useAccelerateEndpoint: true
  });
  let signedUrls = [];
  for (record of eventRecords) {
    let params = {
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
      Expires: 60 * 60 * 24 * 3, // 3 days for slack MVP
    };
    signedUrls.push(s3.getSignedUrl('getObject', params));
  }
  return signedUrls;
}

/**
 * Wrap slack webhook as promise.
 */
const slackWebhookPromise = (slack, message) => {
  return new Promise((resolve, reject) => {
    slack.webhook(message, (err, response) => {
      if (!err) {
        console.log('no error', response);
        resolve(response);
      } else {
        console.log(err);
        reject(err);
      }
    });
  });
}

/**
 * Send images to slack.
 */
const sendSlackMessages = async (slack, urls) => {
  try {
    for (url of urls) {
      console.log('sending for url', url);
      await slackWebhookPromise(slack, {
        channel: '#twin-tiger',
        username: 'twin-tiger',
        icon_emoji: ':cat2:',
        text: 'Twin Tiger Security Camera',
        attachments: [
          {
            image_url: url
          }
        ]
      });
    }
  } catch (err) {
    console.log(`sendSlackMessages error: ${err.message}`);
  } 
  return;
}

exports.handler = async (event, context) => {
  if (event.hasOwnProperty('Records') && event.Records.length > 0) {
    const slackWebhook = process.env.SLACK_WEBHOOK;
    console.log('hook', slackWebhook);
    const slack = new Slack();
    slack.setWebhook(slackWebhook);

    const urls = await getSignedUrls(event.Records);
    console.log('urls', urls);
    await sendSlackMessages(slack, urls);
    console.log('hello');
    context.succeed(`${urls.length} images sent to slack`);
  }
};
