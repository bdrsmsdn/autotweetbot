const Twit = require('twit');
const fs = require('fs');
const path = require('path');

const { downloadMedia } = require('./downloader');

const tg = '/upload';

class Twitt {
  constructor(props) {
    this.T = new Twit({
      consumer_key: props.consumer_key,
      consumer_secret: props.consumer_secret,
      access_token: props.access_token,
      access_token_secret: props.access_token_secret,
    });
  }

  getAdminUserInfo = () => {
    return new Promise((resolve, reject) => {
      this.T.get('account/verify_credentials', { skip_status: true })
        .then((result) => {
          const userId = result.data.id_str;
          resolve(userId);
        })
        .catch((err) => {
          console.log('error on get admin <<<<<<<<<<<<<<');

          reject(err);
        });
    });
  };

  getReceivedMessages = (messages, userId) => {
    return messages.filter((msg) => msg.message_create.sender_id !== userId);
  };

  getCase1 = (receivedMessages) => {
    return receivedMessages.filter((msg) => {
      const message = msg.message_create.message_data.text;
      const command = message.toLowerCase().split(' ')[0] || '';
      if (command.includes('/upload')) return;
    });
  };

  getCase2 = (receivedMessages) => {
    return receivedMessages.filter((msg) => {
      const message = msg.message_create.message_data.text;
      const command = message.toLowerCase().split(' ')[0] || '';
      if (command.includes('/delete')) return;
    });
  };

  getUnnecessaryMessages = (receivedMessages, trigger) => {
    return receivedMessages.filter((msg) => {
      const message = msg.message_create.message_data.text;
      const words = this.getEachWord(message);
      return !words.includes(trigger);
    });
  };

  getTriggerMessages = (receivedMessages, trigger) => {
    return receivedMessages.filter((msg) => {
      const message = msg.message_create.message_data.text;
      const words = this.getEachWord(message);
      return words.includes(trigger);
    });
  };

  getEachWord = (message) => {
    let words = [];
    let finalWords = [];
    const separateEnter = message.split('\n');
    separateEnter.forEach((line) => (words = [...words, ...line.split(' ')]));
    words.forEach((word) => {
      const splitComma = word.split(',');
      finalWords = [...finalWords, ...splitComma];
    });
    return finalWords;
  };

  getDirectMessage = (userId) => {
    return new Promise((resolve, reject) => {
      this.T.get('direct_messages/events/list', async (error, data) => {
        try {
          if (!error) {
            const messages = data.events;
            const receivedMessages = this.getReceivedMessages(messages, userId);
            const unnecessaryMessages = this.getUnnecessaryMessages(receivedMessages, tg);
            const triggerMessages = this.getTriggerMessages(receivedMessages, tg);
            await this.deleteUnnecessaryMessages(unnecessaryMessages);
            resolve(triggerMessages.reverse().slice(0, 25));
          } else {
            reject('error on get direct message');
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  //   replyMessage = (message) => {
  //     return new Promise((resolve, reject) => {
  //       this.T.post(
  //         'direct_messages/events/new',
  //         {
  //           event: {
  //             type: 'message_create',
  //             message_create: {
  //               target: {
  //                 recipient_id: msg.message_create.sender_id,
  //               },
  //               message_data: {
  //                 text: message,
  //               },
  //             },
  //           },
  //         },
  //         (error, event) => {
  //           if (error) {
  //             console.log(error);
  //           } else {
  //             console.log(event);
  //           }
  //         }
  //       );
  //     });
  //   };

  uploadMedia = (filePath, type) => {
    return new Promise((resolve, reject) => {
      console.log('Media being uploaded....');
      const b64content = fs.readFileSync(filePath, {
        encoding: 'base64',
      });
      if (type === 'photo') {
        this.T.post('media/upload', { media_data: b64content }, (error, data) => {
          if (!error) {
            resolve(data);
            console.log('Media has been successfuly uploaded....');
          } else {
            //fs.unlinkSync(filePath);
            reject(error);
          }
        });
      } else {
        this.T.postMediaChunked({ file_path: filePath }, (error, data) => {
          if (!error) {
            resolve(data);
            console.log('Media has been successfuly uploaded....');
          } else {
            //fs.unlinkSync(filePath);
            reject(error);
          }
        });
      }
    });
  };

  deleteTweet = (message) => {
    return message.filter((msg) => {
      const message = msg.message_create.message_data.text;

      return new Promise(async (resolve, reject) => {
        const args = message.toLowerCase().split(' ')[0] || '';
        const command = args.split('/').pop().split('?').shift();
        console.log(args);
        console.log(args.length);
        console.log(message);

        if (args.length >= 1) {
          this.T.post('statuses/destroy/' + command, {}, function (err, data, response) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        }
      });
    });
  };

  saveMedia = (message) => {
    return new Promise(async (resolve, reject) => {
      const attachment = message.message_create.message_data.attachment;
      if (attachment) {
        let mediaUrl = attachment.media.media_url;
        const splittedUrl = mediaUrl.split('/');
        const fileName = splittedUrl[splittedUrl.length - 1];
        await downloadMedia(mediaUrl, fileName);
        console.log('Media has been successfuly uploaded....' + fileName);
        const b64content = fs.readFileSync(__dirname + '/lib/images/' + fileName);
        this.T.post(path.join(__dirname + '/lib/images/'), { media_data: b64content }, (error, data) => {
          if (!error) {
            resolve(data);
          } else {
            //fs.unlinkSync(filePath);
            reject(error);
          }
        });
      }
      //   this.T.post('statuses/update', { status: `[BOT]\n\nSuccessfully upload picture to database!\n\n DM ID: ${message.id}` }, function (error, data, response) {
      //     if (!error) {
      //       console.log(`successfuly posting new status with DM id ${message.id}`);
      //     } else {
      //       console.log(error);
      //     }
      //   });
    });
  };

  tweetMessage = (message) => {
    return new Promise(async (resolve, reject) => {
      try {
        const status = this.sliceMessage(message);
        const payload = {
          status: status[0],
        };
        const attachment = message.message_create.message_data.attachment;
        if (attachment) {
          const media = attachment.media;
          const type = attachment.media.type;
          let mediaUrl = '';
          if (type === 'animated_gif') {
            mediaUrl = media.video_info.variants[0].url;
          } else if (type === 'video') {
            mediaUrl = media.video_info.variants[0].url.split('?')[0];
          } else {
            mediaUrl = attachment.media.media_url;
          }
          const splittedUrl = mediaUrl.split('/');
          const fileName = splittedUrl[splittedUrl.length - 1];
          await downloadMedia(mediaUrl, fileName);
          const uploadedMedia = await this.uploadMedia(fileName, type);
          fs.unlinkSync(fileName);
          console.log('media has been deleted from local....');
          payload.media_ids = [uploadedMedia.media_id_string];
        }
        console.log(`process updating status with id: ${message.id}`);
        this.T.post('statuses/update', payload, (error, data) => {
          if (!error) {
            console.log(`successfuly posting new status with DM id ${message.id}`);
            resolve({
              message: `successfuly posting new status with DM id ${message.id}`,
              data,
              msg: status,
            });
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  replyTweetMessage = (message, status) => {
    return new Promise(async (resolve, reject) => {
      try {
        const payload = {
          in_reply_to_status_id: status.id_str,
          status: `@${status.user.screen_name} ${message}`,
        };
        this.T.post('statuses/update', payload, (error, data) => {
          if (!error) {
            console.log(`successfuly reply tweet with status id ${status.id}`);
            resolve({
              message: `successfuly reply tweet with status id ${status.id}`,
              data,
            });
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  deleteUnnecessaryMessages = async (unnecessaryMessages) => {
    if (unnecessaryMessages.length > 3) {
      for (let i = 0; i < 3; i++) {
        await this.deleteMessage(unnecessaryMessages[i]);
        await this.sleep(2000);
      }
    } else {
      for (const msg of unnecessaryMessages) {
        await this.deleteMessage(msg);
        await this.sleep(2000);
      }
    }
  };

  splitByLength = (message) => {
    const splitText = message.split(' ');
    const msg = [];
    const n = Math.ceil(message.length / 250);
    const m = Math.ceil(splitText.length / n);
    for (let i = 0; i < n; i++) {
      let tweet = '';
      for (let j = m * i; j < m * (i + 1); j++) {
        if (!splitText[j]) {
          break;
        }
        if (j % m === 0) {
          tweet = tweet + splitText[j];
        } else {
          tweet = tweet + ' ' + splitText[j];
        }
      }
      if (i !== n - 1) {
        tweet = tweet + ' (cont)';
        msg.push(tweet);
      } else {
        msg.push(tweet);
      }
    }
    return msg;
  };

  sliceMessage = (msg) => {
    let text = msg.message_create.message_data.text;
    const attachment = msg.message_create.message_data.attachment;
    if (attachment) {
      const shortUrl = attachment.media.url;
      text = text.split(shortUrl)[0];
    }
    return this.splitByLength(text);
  };

  deleteMessage = (message) => {
    return new Promise((resolve, reject) => {
      this.T.delete('direct_messages/events/destroy', { id: message.id }, (error, data) => {
        if (!error) {
          const msg = `Message with id: ${message.id} has been successfuly deleted`;
          console.log(msg);
          resolve({
            message: msg,
            data,
          });
        } else {
          reject(error);
        }
      });
    });
  };

  sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = { Twitt };
