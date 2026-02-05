const redisClient = require("../config/redis");
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission")

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,        // REQUIRED on https (Vercel)
  sameSite: "none",    // REQUIRED for cross-site cookies
  maxAge: 60 * 60 * 1000
};


const register = async (req,res)=>{
    
    try{
        // validate the data;

      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user'
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
     const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role:user.role,
    }
    
     res.cookie("token", token, COOKIE_OPTIONS);

     res.status(201).json({
        user:reply,
        message:"Loggin Successfully"
    })
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}


const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId || !password) throw new Error("Invalid Credentials");

    const user = await User.findOne({ emailId });
    if (!user) throw new Error("Invalid Credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid Credentials");

    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role
      },
      message: "Login Successfully"
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};



// logOut feature

const logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) return res.send("Already logged out");

    const payload = jwt.decode(token);

    if (redisClient?.isOpen) {
      await redisClient.set(`token:${token}`, "Blocked");
      await redisClient.expireAt(`token:${token}`, payload.exp);
    }

    res.cookie("token", "", {
      ...COOKIE_OPTIONS,
      maxAge: 0
    });

    res.send("Logged out successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie("token", token, COOKIE_OPTIONS);

     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}


module.exports = {register, login,logout,adminRegister,deleteProfile};