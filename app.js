require('dotenv').config();
const Twit = require('twit');
const cron = require('node-cron');
const { tweetRandomImage, tweetEvent, tes } = require('./lib/function');
console.log('BOT IS STARTING');

//run every 1 hour
cron.schedule('*/30 * * * * *', () => {
  console.log('running a task every 1 hr');
  tweetRandomImage();
});
