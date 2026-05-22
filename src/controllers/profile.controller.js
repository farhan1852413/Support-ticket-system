// 👤 Profile Controller
// Handles incoming profile requests

const profileService = require('../services/profile.service');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Users can only see their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot view other users\' profiles' });
    }

    const profile = await profileService.getProfile(userId);
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const data = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot update other users\' profiles' });
    }

    const result = await profileService.updateProfile(userId, data);
    res.json(result);
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Request profile edit (for approval workflow)
const requestProfileEdit = async (req, res) => {
  try {
    const userId = req.user.id;
    const changes = req.body;

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    const result = await profileService.requestProfileEdit(userId, changes);
    res.json(result);
  } catch (error) {
    console.error('Request profile edit error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get pending profile edits (admin only)
const getPendingEdits = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const edits = await profileService.getPendingEdits();
    res.json({ success: true, pending_edits: edits });
  } catch (error) {
    console.error('Get pending edits error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Approve profile edit (admin only)
const approveProfileEdit = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const result = await profileService.approveProfileEdit(requestId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Approve profile edit error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Reject profile edit (admin only)
const rejectProfileEdit = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { requestId, notes } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const result = await profileService.rejectProfileEdit(requestId, req.user.id, notes || '');
    res.json(result);
  } catch (error) {
    console.error('Reject profile edit error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get activity log
const getActivityLog = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const limit = req.query.limit || 50;

    // Users can only see their own activity log unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot view other users\' activity' });
    }

    const log = await profileService.getActivityLog(userId, limit);
    res.json({ success: true, ...log });
  } catch (error) {
    console.error('Get activity log error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get achievements
const getAchievements = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const achievements = await profileService.getAchievements(userId);
    res.json({ success: true, ...achievements });
  } catch (error) {
    console.error('Get achievements error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Award achievement (admin only)
const awardAchievement = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { userId, achievementType, badgeName, description, iconUrl } = req.body;

    if (!userId || !achievementType || !badgeName) {
      return res.status(400).json({
        error: 'userId, achievementType, and badgeName are required'
      });
    }

    const result = await profileService.awardAchievement(
      userId,
      achievementType,
      badgeName,
      description || '',
      iconUrl || null
    );

    res.json(result);
  } catch (error) {
    console.error('Award achievement error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  requestProfileEdit,
  getPendingEdits,
  approveProfileEdit,
  rejectProfileEdit,
  getActivityLog,
  getAchievements,
  awardAchievement
};
