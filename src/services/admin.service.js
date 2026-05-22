const adminRepository = require('../repositories/admin.repository');

/**
 * Get all users (admin only)
 */
const getAllUsers = async () => {
  return await adminRepository.getAllUsers();
};


const getAgentsByCategory = async (categoryId) => {
  if (!categoryId) {
    throw new Error('Category ID is required');
  }

  return await adminRepository.getAgentsByCategory(categoryId);
};


/**
 * Toggle user active status
 */
const toggleUserActiveStatus = async (adminId, userId) => {
  if (adminId === parseInt(userId)) {
    throw new Error("Admin cannot deactivate themselves");
  }

  // First fetch all users to find current status
  const users = await adminRepository.getAllUsers();
  const user = users.find(u => u.id === parseInt(userId));

  if (!user) {
    throw new Error("User not found");
  }

  const newStatus = !user.is_active;

  await adminRepository.toggleUserActiveStatus(userId, newStatus);

  return { message: "User status updated successfully" };
};


/**
 * Update user role
 */
const updateUserRole = async (userId, role) => {
  const allowedRoles = ['user', 'agent', 'admin'];

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  await adminRepository.updateUserRole(userId, role);

  return { message: "User role updated successfully" };
};

const getTicketAnalytics = async () => {
  return await adminRepository.getTicketAnalytics();
};

const getAdvancedAnalytics = async () => {
  return await adminRepository.getAdvancedAnalytics();
};

module.exports = {
  getAllUsers,
  toggleUserActiveStatus,
  updateUserRole,
  getTicketAnalytics,
  getAdvancedAnalytics,
  getAgentsByCategory
};