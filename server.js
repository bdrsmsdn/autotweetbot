const fs = require('fs');
const path = require('path');
const Twit = require('twit');
const config = require('./config');
const cron = require('node-cron');

const T = new Twit(config);

// T.post('statuses/update', { status: 'TES' }, function (err, data, response) {
//   console.log(data);
// });

console.log('BOT IS STARTING');

function randomFromArray(arr) {
  // return images[Math.floor(Math.random() * images.length)];
  return arr[Math.floor(Math.random() * arr.length)];
}

function tweetRandomImage() {
  fs.readdir(__dirname + '/images', function (err, files) {
    if (err) {
      console.log('error:', err);
    } else {
      let images = [];
      files.forEach(function (f) {
        images.push(f);
      });

      console.log('opening an image...');

      const imagePath = path.join(__dirname, '/images/' + randomFromArray(images)),
        b64content = fs.readFileSync(imagePath, { encoding: 'base64' });

      console.log('uploading an image...');

      T.post('media/upload', { media_data: b64content }, function (err, data, response) {
        if (err) {
          console.log('error:', err);
        } else {
          const image = data;
          console.log('image uploaded, adding description...');

          T.post(
            'media/metadata/create',
            {
              media_id: image.media_id_string,
              alt_text: {
                text: 'pacarkuuu',
              },
            },
            function (err, data, response) {
              console.log('tweeting the image...');
              var statusArray = ['my pretty gf', '💕', 'the cuttest', 'muffin', 'lifetime lover', 'be my last', 'biggest flex', 'darl', 'bbbb', 'heavenly creature', '💞', '💗', '💖', '💓', '💘', '💝', '💥', '💫', '😍', '🥰'];
              T.post(
                'statuses/update',
                {
                  status: randomFromArray(statusArray),
                  media_ids: [image.media_id_string],
                },
                function (err, data, response) {
                  if (err) {
                    console.log('error:', err);
                  } else {
                    console.log('posted an image!');
                  }
                }
              );
            }
          );
        }
      });
    }
  });
}

// setInterval(function () {
//   tweetRandomImage();
// }, 3600000); //1 sec = 1000ms

cron.schedule('* * */1 * * *', () => {
  console.log('running a task every 1 hr');
  tweetRandomImage();
});
