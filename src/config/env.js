// This file will:
    // Load .env
    // Make sure environment variables are available everywhere
// We centralize it so we don’t call dotenv.config() in random files.

// 🧠 What This Does
    // Loads .env file
    // Exports config values
    // Gives default PORT if not provided

// Now every file can do:
    // const { PORT } = require('./config/env');

// Instead of reading process.env directly everywhere.


const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'
};