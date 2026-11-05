const express = require("express");
const { registerValidator ,loginValidator } = require("../validators/authValidator");
const validateRequest = require("../middleware/validationMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");
const router = express.Router();

const {
    register,
    login,
    getMe
}= require("../controllers/authController");


const { protect } = require("../middleware/authMiddleware");

//POST /api/auth/register
router.post("/register",authLimiter,registerValidator,validateRequest, register);

//POST /api/auth/login
router.post("/login",authLimiter,loginValidator,validateRequest, login);

router.get("/me", protect, getMe);

module.exports = router;