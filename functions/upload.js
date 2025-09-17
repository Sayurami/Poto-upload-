const { v2: cloudinary } = require('cloudinary');
const multipart = require('@stream-io/multipart');
const FormData = require('form-data');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse multipart/form-data
    const parser = multipart();
    const { files, fields } = await parser.parse(event.body);
    const file = files.photo;

    const uploaded = await cloudinary.uploader.upload(file.path, {
      folder: 'gojo-photos',
      public_id: Date.now().toString(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        url: uploaded.secure_url,
        name: fields.name || 'No Name',
        description: fields.description || 'No Description',
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: 'Upload failed: ' + err.message };
  }
};
