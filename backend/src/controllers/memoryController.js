
const Memory = require("../models/Memory");


//submit a new campus memory

const createMemory = async(req,res) => {
    try{
        const{
            title,
            story,
            year,
            eventDate,
            category,
            tags,
        
        } = req.body || {};


        //validate required fields
        if(!title || !story || !year || !category) {
            return res.status(400).json({success:false, message:"Title, story, year and category are required"});
        }

        //create new memory in the database

        const memory = await Memory.create({
            title,
            story,
            year:Number(year),
            eventDate: eventDate || undefined,
            category,
            tags: tags || [],
            submittedBy: req.user._id,
            status: "pending"
        });

        return res.status(201).json({success:true, message:"Memory submitted successfully", memory});

    } catch(error){
        console.error("Error submitting memory:", error);
        return res.status(500).json({success:false, message:"Failed to submit memory"});
    }       

};

// Get all approved memories for public timeline

const getApprovedMemories = async (req, res) => {
    try {
        const memories = await Memory.find({
            status: "approved"
        })
        .populate("submittedBy", "name batch")
        .sort({ year: -1 });

        return res.status(200).json({
            success: true,
            count: memories.length,
            memories
        });

    } catch (error) {
        console.error("Error fetching memories:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch memories"
        });
    }
};

// Get memories submitted by the logged-in user

const getMyMemories = async (req, res) => {
    try {
        const memories = await Memory.find({
            submittedBy: req.user._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: memories.length,
            memories
        });

    } catch (error) {
        console.error("Error fetching my memories:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your memories"
        });
    }
};

module.exports = { createMemory, getApprovedMemories, getMyMemories };