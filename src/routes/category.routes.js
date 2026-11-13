const { Router } = require('express');
const controller = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const requireRole = require('../middlewares/requireRole');
const { authenticate } = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');
const { idParamSchema } = require('../validators/common.validator');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');

const router = Router();
const adminOnly = [authenticate, requireRole(ROLES.ADMIN)];
const withId = validate(idParamSchema, 'params');

// Público: categorías activas (para el filtro del catálogo)
router.get('/', controller.list);

// Admin: gestión de categorías
router.get('/all', ...adminOnly, controller.listAll);
router.post('/', ...adminOnly, validate(createCategorySchema), controller.create);
router.put('/:id', ...adminOnly, withId, validate(updateCategorySchema), controller.update);
router.delete('/:id', ...adminOnly, withId, controller.remove);
router.patch('/:id/restore', ...adminOnly, withId, controller.restore);

module.exports = router;
