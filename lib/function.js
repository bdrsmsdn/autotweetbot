const fs = require('fs');
const path = require('path');
const Twit = require('twit');
const sharp = require('sharp');
const { default: axios } = require('axios');
const download = require('download');

const T = new Twit({ consumer_key: process.env.CONSUMER_KEY, consumer_secret: process.env.CONSUMER_KEY_SECRET, access_token: process.env.ACCESS_TOKEN, access_token_secret: process.env.ACCESS_TOKEN_SECRET });

// function watermarkImageWithText(originalImageFile, watermarkText, destinationImage) {
//   watermark([originalImageFile])
//     .image(watermark.text.center(watermarkText, '25px serif', '#fff', 0.5))
//     .then(function (watermarkedImage) {
//       destinationImage = watermarkedImage.src;
//     });
// }

async function addTextOnImage(file) {
  try {
    const width = 500;
    const height = 500;
    const text = '@allaboutpeh';

    const svgImage = `
    <svg width="${width}" height="${height}">
      <style>
      .title { fill: #fff; stroke: #000; font-size: 50px; font-weight: bold}
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="title"  opacity="0.1">${text}</text>
    </svg>
    `;
    const svgBuffer = Buffer.from(svgImage);
    const image = await sharp(file)
      .composite([
        {
          input: svgBuffer,
          top: 350,
          left: 125,
        },
      ])
      .toFile('images.png');
  } catch (error) {
    console.log(error);
  }
}

function randomFromArray(arr) {
  // return images[Math.floor(Math.random() * images.length)];
  return arr[Math.floor(Math.random() * arr.length)];
}

async function tweetRandomImage() {
  const res = await axios.get('https://peh-upload.herokuapp.com/user');
  const sul = randomFromArray(res.data);
  const esu = sul.images[0];
  const { avatar, cloudinary_id } = await esu;
  console.log(avatar);
  console.log('opening an image...');
  fs.writeFileSync('image.png', await download(avatar));
  console.log('image opened, adding watermark to image...');
  await addTextOnImage('image.png');
  b64content = fs.readFileSync('images.png', { encoding: 'base64' });
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
            text: 'this picture belong to @switchblase',
          },
        },
        function (err, data, response) {
          console.log('tweeting the image...');
          var statusArray = [
            'my pretty gf',
            '💕',
            'the cuttest',
            'muffin',
            'lifetime lover',
            'be my last',
            'biggest flex',
            'darl',
            'bbbb',
            'heavenly creature',
            '💞',
            '💗',
            '💖',
            '💓',
            '💘',
            '💝',
            '💥',
            '💫',
            '😍',
            '🥰',
            'princess',
            'love of my life',
            'she looks so fine',
          ];
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
                //posted image will move to uploaded directory
                // let form = new formidable.IncomingForm();
                // form.uploadDir = path.join(__dirname + '/uploaded/');
                // const nim = 'uploaded/' + img;
                // fs.rename(imagePath, nim, function (err) {
                //   if (err) throw err;
                //   console.log('Successfully moved image!');
                // });
              }
            }
          );
        }
      );
    }
  });
}

// var stream = T.stream('statuses/filter', { track: ['@frostxbit3'] });
// stream.on('tweet', tweetEvent);

// function tweetEvent(tweet) {
//   // Who sent the tweet?
//   var name = tweet.user.screen_name;
//   // What is the text?
//   var txt = tweet.text;
//   var word = txt.split(' ');
//   var verse = txt.includes('delete');

//   var nameID = tweet.id_str;
//   T.get('search/tweets', { q: '@frostxbit3', count: 100, result_type: 'recent' }, function (err, data, response) {
//     var twtID = data.statuses[0].id_str;
//     // var sentence = body.data.text
//     var reply = `@${name} berhasil!`;
//     var params = {
//       status: reply,
//       in_reply_to_status_id: nameID,
//     };
//     if (verse) {
//       T.post('statuses/destroy/' + twtID, {}, function (err, data, response) {
//         if (err !== undefined) {
//           console.log(err);
//         } else {
//           console.log('Tweet deleted: ' + twtID);
//         }
//       });
//       // T.post('statuses/update', params, function (err, data, response) {
//       //   if (err !== undefined) {
//       //     console.log(err);
//       //   } else {
//       //     console.log('Tweeted: ' + params.status);
//       //   }
//       // });
//     } else {
//       console.log('Tagged but not triggered');
//     }
//   });
// }

exports.tweetRandomImage = tweetRandomImage;
// exports.tweetEvent = tweetEvent;
