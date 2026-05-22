const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY name ASC');
    res.json(rows); // Return pure array for the frontend to map
  } catch (err) {
    res.status(500).json({ error: "DB Error" });
  }
});

module.exports = router;