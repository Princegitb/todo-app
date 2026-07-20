const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Route mapping to AI chat controller function protected with authentication
router.post('/chat', protect, chatWithAI);

module.exports = router;
