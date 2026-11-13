const { Router } = require('express');
const controller = require('../controllers/enrollment.controller');
const validate = require('../middlewares/validate');
const requireRole = require('../middlewares/requireRole');
const { authenticate } = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');
const { idParamSchema } = require('../validators/common.validator');
const { enrollSchema } = require('../validators/user.validator');

const router = Router();

// Todas las rutas de inscripciones son exclusivas del rol "user" (estudiante).
router.use(authenticate, requireRole(ROLES.USER));

router.post('/', validate(enrollSchema), controller.enroll);
router.get('/me', controller.listMine);
router.patch('/:id/cancel', validate(idParamSchema, 'params'), controller.cancel);

module.exports = router;
