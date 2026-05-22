// 🧠 What This Does
    // generateToken(payload)
    // Creates a signed JWT using:
    // Your secret from .env
    // Expiration of 1 day

// We will pass something like:
    // {
    //   id: user.id,
    //   role: user.role
    // }

// verifyToken(token)
// Decodes + verifies token signature.
// If invalid → throws error automatically.
// We will catch that inside middleware later.

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1d' // token valid for 1 day
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};
