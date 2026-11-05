const user = require('../models/User');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');


//generate jwt token

const generateToken = (userId) => {

    return jwt.sign(
        {id:userId},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN}
    );
};



//Register user
 

const register = async (req, res) => {
    try {
    const {name, email, password, batch} = req.body;
   

    //validate required fields
    if(!name || !email || !password ){
        return res.status(400).json({success:false, message:"name, email, and password are required"});

    }
    if(password.length < 6){
        return res.status(400).json({success:false, message:"Password must be at least 6 characters long"});
    }


    //check if user already exists

    const existingUser = await user.findOne({
        email:email.toLowerCase().trim()
    });

    if(existingUser){
        return res.status(400).json({success:false, message:"User already exists with this email"});
    }

    //hash password

    const hashedPassword = await bcrypt.hash(password,12);




    //Create new user
  const user =await user.create({
    name,
    email,
    password:hashedPassword,
    batch,
    role: "contributor"
  });



  //Generate JWT token

  const token = generateToken(user._id);

  res.status(201).json({
    success:true,
    message:"User registered successfully",
    token,
    user:{
        id:user._id,
        name:user.name,
        email:user.email,
        batch:user.batch,
        role:user.role
    }
  });

}catch(error){
    res.status(500).json({success:false, message:"Server error", error:error.message});

}
};

//login user

const login = async (req, res) => {
    try{
        const {email, password} = req.body; 

        if(!email || !password){
            return res.status(400).json({success:false, message:"Email and password are required"});
        }

        //Find user and include password field
        const user = await user.findOne({email: email.toLowerCase().trim()}).select('+password');

        if(!user){
            return res.status(400).json({success:false, message:"Invalid email or password"});
        }

        //Compare password
        const ispasswordCorrect = await bcrypt.compare(password, user.password);

        if(!ispasswordCorrect){
            
            return res.status(400).json({success:false, message:"Invalid email or password"});
        }

        //Generate JWT token
        const token = generateToken(user._id);


        res.status(200).json({
            success:true,
            message:"User logged in successfully",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                batch:user.batch,
                role:user.role
            }
        }); 

        //get me  
        const getMe = async (req, res) => {
            res.status(200).json({
                success: true,
                user:{
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    batch: req.user.batch,
                    role: req.user.role
                }
            });
        }

    }catch(error){
        res.status(500).json({success:false, message:"Server error", error:error.message});
    }
};

module.exports = {
    register,
    login,
    getMe
};