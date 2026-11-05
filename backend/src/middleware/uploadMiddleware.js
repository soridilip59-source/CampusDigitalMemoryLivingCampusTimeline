
const multer = require("multer");

// Store uploaded files in memory
const storage = multer.memoryStorage();

// Configure upload middleware
const upload = multer({
    storage,

    // Maximum file size: 5 MB
    limits: {
        fileSize: 5 * 1024 * 1024
    },

    // Allow only image files
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed!"));
        }
    }
});

module.exports = upload;
