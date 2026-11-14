const { Router } = require('express');
const requireRole = require('../middlewares/requireRole');
const { authenticate } = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');
const statsController = require('../controllers/stats.controller');

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'API TechLearn funcionando' }));

router.use('/auth', require('./auth.routes'));
router.use('/courses', require('./course.routes'));
router.use('/categories', require('./category.routes'));
router.use('/instructors', require('./instructor.routes'));
router.use('/enrollments', require('./enrollment.routes'));
router.use('/users', require('./user.routes'));
router.use('/uploads', require('./upload.routes'));
router.get('/stats', authenticate, requireRole(ROLES.ADMIN), statsController.getDashboard);

module.exports = router;
