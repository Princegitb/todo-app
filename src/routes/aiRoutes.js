const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');

// Route mapping to AI chat controller function
router.post('/chat', chatWithAI);

module.exports = router;
