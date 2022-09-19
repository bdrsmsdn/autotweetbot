require('dotenv').config();
const Twit = require('twit');
// const formidable = require('formidable');
const cron = require('node-cron');
const { tweetRandomImage, tweetEvent } = require('./lib/function');
const { Twitt } = require('./twitter');
// const { config } = require('./utils/config');

const bot = new Twitt({ consumer_key: process.env.CONSUMER_KEY, consumer_secret: process.env.CONSUMER_KEY_SECRET, access_token: process.env.ACCESS_TOKEN, access_token_secret: process.env.ACCESS_TOKEN_SECRET });

console.log('BOT IS STARTING');

async function doJob() {
  console.log(`execute @ ${new Date().toTimeString()}`);
  let tempMessage = {};
  try {
    const authenticatedUserId = await bot.getAdminUserInfo();
    const messages = await bot.getDirectMessage(authenticatedUserId);
    if (messages[0]) {
      messages.forEach((message, index) => {
        setTimeout(async () => {
          console.log(`${index + 1}. PROCESSING...`);
          if (message.id) {
            tempMessage = message;
            await bot.saveMedia(message);
            await bot.deleteMessage(message);
            console.log(`=== DM has been successfuly ..`);
            console.log('------------------------------------');
          }
          if (index === messages.length - 1) {
            console.log('ALL DONE!');
          }
        }, index * 10000);
      });
    } else {
      console.log('waiting a message');
      console.log('------------------------------------');
    }
  } catch (error) {
    console.log(error, 'ERROR.');
    console.log('------------------------------------');
    if (tempMessage.id) {
      await bot.deleteMessage(tempMessage);
    }
  }
}

//run every 1 hour
cron.schedule('*/30 * * * * *', () => {
  console.log('running a task every 1 hr');
  tweetRandomImage();
});

cron.schedule('*/3 * * * *', () => {
  console.log('running message task every 3 minutes');
  //tweetRandomImage();
  // doJob();
  //tweetEvent();
  // mentionDetectionInterval();
});
