const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

// Upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto"
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;


