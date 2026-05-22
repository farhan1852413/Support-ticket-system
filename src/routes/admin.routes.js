const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// All admin routes must pass auth + admin role check
router.use(authMiddleware, requireRole('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/toggle-active', adminController.toggleUserActiveStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/analytics', adminController.getTicketAnalytics);
router.get('/analytics/advanced', adminController.getAdvancedAnalytics);

router.get('/agents', adminController.getAgents);

module.exports = router;