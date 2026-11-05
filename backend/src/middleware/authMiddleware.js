const jwt = require('jsonwebtoken');

const User  =require("../models/User");


const protect = async(req,res,next) => {

    try {
        let token;


        //check authentication header

        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
            token = req.headers.authorization.split(" ")[1];
        }
        if(!token){ 
            return res.status(401).json({success:false, message:"Not authorized, no token"});
        }

        //verify token

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //find user by id

        const user = await User.findById(decoded.id);

        if(!user){
            return res.status(401).json({success:false, message:"Not authorized, user not found"});
        }

        //attach user to request object
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({success:false, message:"Not authorized, token failed"});
    }
};

module.exports = { protect };
