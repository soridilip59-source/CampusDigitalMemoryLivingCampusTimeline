
const Memory = require("../models/Memory");
const {
    uploadMedia,
    deleteMedia
} = require("../services/mediaService");

// Create a new campus memory
const createMemory = async (req, res) => {
    let uploadedImage = null;

    try {
        const {
            title,
            story,
            year,
            eventDate,
            category,
            tags,
            altText
        } = req.body;

        // Validate tags
        let parsedTags = [];

        if (tags) {
            try {
                parsedTags = Array.isArray(tags)
                    ? tags
                    : JSON.parse(tags);

                if (!Array.isArray(parsedTags)) {
                    return res.status(400).json({
                        success: false,
                        message: "Tags must be an array"
                    });
                }
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Invalid tags format"
                });
            }
        }

        // Upload image to Cloudinary
        const media = [];

        if (req.file) {
            uploadedImage = await uploadMedia(req.file.buffer);

            media.push({
                url: uploadedImage.url,
                public_id: uploadedImage.public_id,
                type: "image",
                altText: altText || ""
            });
        }

        // Save memory in MongoDB
        const memory = await Memory.create({
            title,
            story,
            year,
            eventDate,
            category,
            tags: parsedTags,
            media,
            submittedBy: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "Memory created successfully!",
            memory
        });

    } catch (error) {
        // Delete uploaded image if saving fails
        if (uploadedImage) {
            try {
                await deleteMedia(uploadedImage.public_id);
            } catch (deleteError) {
                console.error(
                    "Cloudinary cleanup failed:",
                    deleteError.message
                );
            }
        }

        console.error("Create memory error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all campus memories
const getAllMemories = async (req, res) => {
    try {
        const memories = await Memory.find()
            .populate("submittedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: memories.length,
            memories
        });

    } catch (error) {
        console.error("Get memories error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createMemory,
    getAllMemories
};
