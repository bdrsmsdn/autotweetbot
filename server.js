const fs = require('fs');
const path = require('path');
const Twit = require('twit');
const config = require('./config');

const T = new Twit(config);

// T.post('statuses/update', { status: 'TES' }, function (err, data, response) {
//   console.log(data);
// });
// TRIGGER

console.log('BOT IS STARTING');

function randomFromArray(images) {
  return images[Math.floor(Math.random() * images.length)];
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

              T.post(
                'statuses/update',
                {
                  status: '💞',
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

setInterval(function () {
  tweetRandomImage();
}, 60000); //3600000
