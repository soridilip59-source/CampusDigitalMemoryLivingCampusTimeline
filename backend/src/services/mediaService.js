

const cloudinary = require("../config/cloudinary");

// Upload image to Cloudinary
const uploadMedia = (fileBuffer, resourceType = "image") => {
    return new Promise((resolve, reject) => {
        if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
            return reject(new Error("Valid file buffer is required"));
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                folder: "campus-memories"
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                if (!result) {
                    return reject(new Error("Cloudinary upload failed"));
                }

                resolve({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );

        uploadStream.on("error", reject);
        uploadStream.end(fileBuffer);
    });
};

// Delete media from Cloudinary
const deleteMedia = async (publicId, resourceType = "image") => {
    if (!publicId) {
        throw new Error("Public ID is required");
    }

    return cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
    });
};

module.exports = {
    uploadMedia,
    deleteMedia
};
