const express = require('express');

const authRouter =  express.Router();
const {register, login, logout, adminRegister, deleteProfile, getAllUsers, updateUserRole, adminDeleteUser} = require('../controllers/auth.controller')
const userMiddleware = require("../middleware/user.middleware");
const adminMiddleware = require('../middleware/admin.middleware');
const createRateLimiter = require("../middleware/rateLimiter.middleware");

// Per-IP limits on public auth routes to slow brute-force attempts.
const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 8, keyPrefix: "rl:login", by: "ip" });
const registerLimiter = createRateLimiter({ windowMs: 60_000, max: 5, keyPrefix: "rl:register", by: "ip" });

// Register
authRouter.post('/register', registerLimiter, register);
authRouter.post('/login', loginLimiter, login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware ,adminRegister);
authRouter.delete('/:id', adminMiddleware, adminDeleteUser);
authRouter.get('/all', adminMiddleware, getAllUsers);
authRouter.put('/role/:id', adminMiddleware, updateUserRole);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);
authRouter.get('/check',userMiddleware,(req,res)=>{

    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id:req.result._id,
        role:req.result.role,
    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    });
})
const { getProfileStats } = require('../controllers/profile.controller');

authRouter.get('/profile', userMiddleware, getProfileStats);

module.exports = authRouter;

// login
// logout
// GetProfile

