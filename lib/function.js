const fs = require('fs');
const path = require('path');
const Twit = require('twit');
const sharp = require('sharp');
const { default: axios } = require('axios');
const download = require('download');

const T = new Twit({ consumer_key: process.env.CONSUMER_KEY, consumer_secret: process.env.CONSUMER_KEY_SECRET, access_token: process.env.ACCESS_TOKEN, access_token_secret: process.env.ACCESS_TOKEN_SECRET });

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
    await sharp(file)
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
  return arr[Math.floor(Math.random() * arr.length)];
}

async function tweetRandomImage() {
  const res = await axios.get(process.env.URL_API+'/user');
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

exports.tweetRandomImage = tweetRandomImage;
