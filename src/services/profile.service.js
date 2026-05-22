// 👤 Profile Service
// Handles user profile logic, stats, and management

const userRepository = require('../repositories/user.repository');

// Get complete user profile with statistics
const getProfile = async (userId) => {
  const profile = await userRepository.getProfileWithStats(userId);

  if (!profile) {
    throw new Error('User not found');
  }

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role,
    join_date: profile.created_at,
    phone: profile.phone,
    address: profile.address,
    department: profile.department,
    team: profile.team,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    statistics: {
      total_tickets: profile.total_tickets || 0,
      resolved_tickets: profile.resolved_tickets || 0,
      open_tickets: profile.open_tickets || 0,
      in_progress_tickets: profile.in_progress_tickets || 0
    }
  };
};

// Update user profile
const updateProfile = async (userId, data) => {
  const { phone, address, department, team, avatar_url, bio } = data;

  await userRepository.createOrUpdateProfile(userId, {
    phone,
    address,
    department,
    team,
    avatar_url,
    bio
  });

  // Log activity
  await userRepository.logActivity(userId, 'PROFILE_UPDATE', 'user', userId, {
    phone,
    address,
    department,
    team,
    avatar_url,
    bio
  });

  return { success: true, message: 'Profile updated successfully' };
};

// Request profile edit (for admin approval workflow)
const requestProfileEdit = async (userId, changes) => {
  const result = await userRepository.createProfileEditRequest(userId, changes);

  // Log activity
  await userRepository.logActivity(userId, 'PROFILE_EDIT_REQUEST', 'profile_edit', result.insertId, {
    changes
  });

  return {
    success: true,
    message: 'Profile edit request submitted for approval',
    request_id: result.insertId
  };
};

// Get pending profile edits (admin only)
const getPendingEdits = async () => {
  const edits = await userRepository.getPendingProfileEdits();
  return edits;
};

// Approve profile edit (admin only)
const approveProfileEdit = async (requestId, reviewedById) => {
  const editRequest = await userRepository.getProfileEditRequest(requestId);

  if (!editRequest) {
    throw new Error('Edit request not found');
  }

  if (editRequest.status !== 'pending') {
    throw new Error('Edit request is not pending');
  }

  const changes = JSON.parse(editRequest.changes);

  // Apply changes
  await updateProfile(editRequest.user_id, changes);

  // Approve the request
  await userRepository.approveProfileEdit(requestId, reviewedById);

  // Log activity
  await userRepository.logActivity(reviewedById, 'PROFILE_EDIT_APPROVED', 'profile_edit', requestId, {
    user_id: editRequest.user_id,
    changes
  });

  return {
    success: true,
    message: 'Profile edit approved and applied'
  };
};

// Reject profile edit (admin only)
const rejectProfileEdit = async (requestId, reviewedById, notes = '') => {
  const editRequest = await userRepository.getProfileEditRequest(requestId);

  if (!editRequest) {
    throw new Error('Edit request not found');
  }

  if (editRequest.status !== 'pending') {
    throw new Error('Edit request is not pending');
  }

  await userRepository.rejectProfileEdit(requestId, reviewedById, notes);

  // Log activity
  await userRepository.logActivity(reviewedById, 'PROFILE_EDIT_REJECTED', 'profile_edit', requestId, {
    user_id: editRequest.user_id,
    notes
  });

  return {
    success: true,
    message: 'Profile edit request rejected'
  };
};

// Get activity log for user
const getActivityLog = async (userId, limit = 50) => {
  const activities = await userRepository.getActivityLog(userId, limit);

  return {
    user_id: userId,
    activities: activities.map(activity => ({
      id: activity.id,
      action_type: activity.action_type,
      entity_type: activity.entity_type,
      entity_id: activity.entity_id,
      details: JSON.parse(activity.details || '{}'),
      timestamp: activity.created_at
    }))
  };
};

// Get user achievements
const getAchievements = async (userId) => {
  const achievements = await userRepository.getAchievements(userId);

  return {
    user_id: userId,
    total_achievements: achievements.length,
    achievements: achievements.map(achievement => ({
      id: achievement.id,
      type: achievement.achievement_type,
      name: achievement.badge_name,
      description: achievement.description,
      icon: achievement.icon_url,
      earned_at: achievement.earned_at
    }))
  };
};

// Award achievement to user (admin only)
const awardAchievement = async (userId, achievementType, badgeName, description, iconUrl) => {
  // Check if user already has this achievement
  const achievements = await userRepository.getAchievements(userId);
  const alreadyHas = achievements.some(a => a.achievement_type === achievementType);

  if (alreadyHas) {
    return { success: false, message: 'User already has this achievement' };
  }

  await userRepository.addAchievement(userId, achievementType, badgeName, description, iconUrl);

  // Log activity
  await userRepository.logActivity(userId, 'ACHIEVEMENT_EARNED', 'achievement', userId, {
    achievement_type: achievementType,
    badge_name: badgeName
  });

  return {
    success: true,
    message: 'Achievement awarded successfully',
    achievement: {
      type: achievementType,
      name: badgeName,
      description,
      icon: iconUrl
    }
  };
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
