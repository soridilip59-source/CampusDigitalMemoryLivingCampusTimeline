
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    }
  );
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, batch } = req.body || {};

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      batch,
      role: "contributor"
    });

    // Generate token
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        batch: user.batch,
        role: user.role
      }
    });

} catch (error) {
  console.error("Registration error:", error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "User already exists with this email"
    });
  }

  return res.status(500).json({
    success: false,
    message: "Registration failed"
  });
}
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user and include password
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        batch: user.batch,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

// Verify the Google ID token on the server before creating a local session.
const googleLogin = async (req, res) => {
  const { credential } = req.body || {};
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!credential) {
    return res.status(400).json({
      success: false,
      message: "Google credential is required"
    });
  }

  if (!clientId) {
    return res.status(503).json({
      success: false,
      message: "Google login is not configured"
    });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("Google token verification error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid Google sign-in credential"
    });
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({
      success: false,
      message: "Google account must have a verified email address"
    });
  }

  try {
    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.findOne({ email });

      if (user?.googleId && user.googleId !== payload.sub) {
        return res.status(409).json({
          success: false,
          message: "This email is already linked to another Google account"
        });
      }

      if (user) {
        user.googleId = payload.sub;
        await user.save();
      } else {
        const googleName = typeof payload.name === "string" ? payload.name.trim().slice(0, 50) : "";
        user = await User.create({
          googleId: payload.sub,
          name: googleName.length >= 2 ? googleName : "Google User",
          email,
          role: "contributor"
        });
      }
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        batch: user.batch,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Google login error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Google login failed"
    });
  }
};

// Get currently logged-in user
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      batch: req.user.batch,
      role: req.user.role
    }
  });
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe
};
