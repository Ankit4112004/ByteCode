const express = require('express');
const aiRouter =  express.Router();
const userMiddleware = require("../middleware/user.middleware");
const solveDoubt = require('../controllers/ai.controller');

aiRouter.post('/chat', userMiddleware, solveDoubt);

module.exports = aiRouter;