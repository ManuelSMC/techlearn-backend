const { Router } = require('express');
const controller = require('../controllers/instructor.controller');
const validate = require('../middlewares/validate');
const requireRole = require('../middlewares/requireRole');
const { authenticate } = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');
const { idParamSchema } = require('../validators/common.validator');
const { updateInstructorProfileSchema, instructorsQuerySchema } = require('../validators/user.validator');

const router = Router();

// Público: directorio de instructores (los primeros son los destacados)
router.get('/', validate(instructorsQuerySchema, 'query'), controller.listPublic);

// Instructor: su propio perfil (va antes de /:id para que "me" no se tome como id)
router.get('/me', authenticate, requireRole(ROLES.INSTRUCTOR), controller.getMyProfile);
router.put('/me', authenticate, requireRole(ROLES.INSTRUCTOR), validate(updateInstructorProfileSchema), controller.updateMyProfile);

// Público: perfil de un instructor
router.get('/:id', validate(idParamSchema, 'params'), controller.getPublicProfile);

module.exports = router;
