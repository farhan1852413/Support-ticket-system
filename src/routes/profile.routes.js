const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// All profile routes require authentication
router.use(authMiddleware);

// Get user profile
router.get('/:userId', profileController.getProfile);

// Update user profile
router.patch('/:userId', profileController.updateProfile);

// Request profile edit (for admin approval)
router.post('/edit-request', profileController.requestProfileEdit);

// Get pending profile edits (admin only)
router.get('/edit/pending', requireRole('admin'), profileController.getPendingEdits);

// Approve profile edit (admin only)
router.post('/edit/approve', requireRole('admin'), profileController.approveProfileEdit);

// Reject profile edit (admin only)
router.post('/edit/reject', requireRole('admin'), profileController.rejectProfileEdit);

// Get activity log
router.get('/activity/:userId', profileController.getActivityLog);

// Get achievements
router.get('/achievements/:userId', profileController.getAchievements);

// Award achievement (admin only)
router.post('/achievements/award', requireRole('admin'), profileController.awardAchievement);

module.exports = router;
