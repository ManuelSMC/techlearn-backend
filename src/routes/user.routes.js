const { Router } = require('express');
const controller = require('../controllers/user.controller');
const validate = require('../middlewares/validate');
const requireRole = require('../middlewares/requireRole');
const { authenticate } = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');
const { idParamSchema } = require('../validators/common.validator');
const { createInstructorSchema, userStatusSchema, usersQuerySchema } = require('../validators/user.validator');

const router = Router();

// Gestión de usuarios: exclusiva del admin.
router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/', validate(usersQuerySchema, 'query'), controller.list);
router.post('/instructors', validate(createInstructorSchema), controller.createInstructor);
router.patch('/:id/status', validate(idParamSchema, 'params'), validate(userStatusSchema), controller.setStatus);

module.exports = router;
