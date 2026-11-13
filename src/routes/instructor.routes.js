const { Router } = require('express');
const controller = require('../controllers/instructor.controller');
const validate = require('../middlewares/validate');
const requireRole = require('../middlewares/requireRole');
const { authenticate } = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');
const { updateInstructorProfileSchema } = require('../validators/user.validator');

const router = Router();

// Público: instructores destacados
router.get('/', controller.listPublic);

// Instructor: su propio perfil
router.get('/me', authenticate, requireRole(ROLES.INSTRUCTOR), controller.getMyProfile);
router.put('/me', authenticate, requireRole(ROLES.INSTRUCTOR), validate(updateInstructorProfileSchema), controller.updateMyProfile);

module.exports = router;
