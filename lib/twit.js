require('dotenv').config();
const Twit = require('twit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const config = require('../utils/config');

const T = new Twit({ consumer_key: process.env.CONSUMER_KEY, consumer_secret: process.env.CONSUMER_KEY_SECRET, access_token: process.env.ACCESS_TOKEN, access_token_secret: process.env.ACCESS_TOKEN_SECRET });

const getTweet = async (tweetId) => {
  let url = `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}`;
  let res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
    },
  });
  let data = res.data.data;
  return data;
};

const getUser = async (userid) => {
  let url = `https://api.twitter.com/2/users/${userid}?user.fields=created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld`;
  let res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
    },
  });
  let data = res.data.data;
  return data;
};

const getMentions = async (userid, start_time) => {
  let url;
  try {
    if (start_time) {
      url = `https://api.twitter.com/2/users/${userid}/mentions?expansions=attachments.media_keys,author_id,entities.mentions.username,in_reply_to_user_id,referenced_tweets.id,referenced_tweets.id.author_id&tweet.fields=created_at&user.fields=name,username&start_time=${start_time}`;
    } else {
      url = `https://api.twitter.com/2/users/${userid}/mentions?expansions=attachments.media_keys,author_id,entities.mentions.username,in_reply_to_user_id,referenced_tweets.id,referenced_tweets.id.author_id&tweet.fields=created_at&user.fields=name,username`;
    }
    let response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
      },
    });
    let data = response.data.data;
    // console.log(data);
    return data;
  } catch (error) {
    console.log(error);
  }
};

const replyMentionedTweets = async (mentionsArr, { statusText, statusTextFormatter }) => {
  statusText = '';
  if (!mentionsArr || mentionsArr.length == 0) {
    // throw new Error('Invalid parameters');
    return;
  }

  for (let mention of mentionsArr) {
    try {
      if (mention.author_id == config.userid_str) continue;
      let tweetText = mention.text;
      if (mention.in_reply_to_user_id && mention.referenced_tweets && mention.referenced_tweets.some((r) => r.type == 'replied_to')) {
        let pTweet = await getTweet(mention.referenced_tweets.find((r) => r.type == 'replied_to').id);

        if (pTweet.entities.user_mentions.find((user) => user.id_str == config.userid_str) || pTweet.user.id_str == config.userid_str) {
          console.log('found a tweet that was replied to by the user');
          if (mention.text.match(new RegExp(`@${config.username}`, 'gi')).length <= 1) {
            console.log(`Ignoring repy to ${pTweet.user.screen_name} bcz I am mentioned in the main tweet`);
            continue;
          }
        }
      }

      let command;

      if (new RegExp(`@${config.username}\\s+render\\b`, 'i').test(mention.text)) {
        command = 'delete';
      } else {
        continue;
      }

      if (!command) continue;

      let authorUser = await getUser(mention.author_id);
      switch (command) {
        case 'delete':
          statusText = `@${authorUser.data.username} Berhasil!`;
          T.post('statuses/destroy/' + mention.id, {}, function (err, data, response) {
            if (err !== undefined) {
              console.log(err);
            } else {
              console.log('Tweet deleted: ' + mention.id);
            }
          });
          break;
        case 'tes':
          T.post(`statuses/update`, { status: 'tes', in_reply_to_status_id: mention.id }, function (err, data, response) {
            if (err) return console.error(err);
          });
          break;
      }

      if (statusText && statusText.length > 0) {
        console.log('statusText length 2: ', statusText.length);
        T.post(`statuses/update`, { status: statusText, in_reply_to_status_id: mention.id }, function (err, data, response) {
          if (err) return console.error(err);
        });
      } else {
        console.log('No status text');
      }
    } catch (error) {
      console.error(error);
    }
  }
};

const getOnlyRepliedMentions = async (mentionsArr, username) => {
  if (!mentionsArr || mentionsArr.length == 0 || !username) return;
  let repliedMentions = [];
  for (let mention of mentionsArr) {
    let tweet = await getTweet(mention.id);
    // console.log(tweet.in_reply_to_status_id_str && tweet.text.includes(username));
    if (tweet.in_reply_to_status_id_str && tweet.full_text.includes(username) && tweet.user.screen_name != username) {
      mention.in_reply_to_status_id_str = tweet.in_reply_to_status_id_str;
      mention.username = tweet.user.screen_name;
      repliedMentions.push(mention);
      // console.log(mention)
    }
  }
  return repliedMentions;
};

exports.getUser = getUser;
exports.getMentions = getMentions;
exports.getOnlyRepliedMentions = getOnlyRepliedMentions;
exports.getTweet = getTweet;
exports.replyMentionedTweets = replyMentionedTweets;

function generateSlug(time) {
  let timeString = time.toString(32);
  let slug = [...timeString]
    .map((c) => {
      if (randInt(0, 1) == 1) {
        return c + randInt(0, 20);
      } else {
        return c;
      }
    })
    .join('');
  return slug;
}

function randInt(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function codeBlockParser(str) {
  const reg = /```(\S*)?(?:\s+)?\n((?:(?!```)[^])+)```/g;
  return [...str.matchAll(reg)].map((e) => ({ lang: e[1], code: e[2] }));
}
