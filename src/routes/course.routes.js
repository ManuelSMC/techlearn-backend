const { Router } = require('express');
const controller = require('../controllers/course.controller');
const validate = require('../middlewares/validate');
const requireRole = require('../middlewares/requireRole');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { ROLES } = require('../utils/constants');
const { idParamSchema } = require('../validators/common.validator');
const {
  createCourseSchema,
  updateCourseSchema,
  courseStatusSchema,
  catalogQuerySchema,
  adminCoursesQuerySchema,
} = require('../validators/course.validator');

const router = Router();
const { ADMIN, INSTRUCTOR } = ROLES;
const withId = validate(idParamSchema, 'params');

// Público: catálogo de cursos publicados
router.get('/', validate(catalogQuerySchema, 'query'), controller.listCatalog);

// Instructor: sus propios cursos (cualquier estado)
router.get('/mine', authenticate, requireRole(INSTRUCTOR), validate(catalogQuerySchema, 'query'), controller.listMine);

// Admin: todos los cursos, con filtro por estado
router.get('/admin', authenticate, requireRole(ADMIN), validate(adminCoursesQuerySchema, 'query'), controller.listAll);

// Detalle: público si está publicado; si no, solo el dueño o el admin
router.get('/:id', optionalAuth, withId, controller.getById);

// Instructor: CRUD de sus cursos
router.post('/', authenticate, requireRole(INSTRUCTOR), validate(createCourseSchema), controller.create);
router.put('/:id', authenticate, requireRole(INSTRUCTOR), withId, validate(updateCourseSchema), controller.update);

// Baja lógica: el dueño o el admin (moderación)
router.delete('/:id', authenticate, requireRole(INSTRUCTOR, ADMIN), withId, controller.remove);

// Estudiantes inscritos: el dueño o el admin
router.get('/:id/students', authenticate, requireRole(INSTRUCTOR, ADMIN), withId, controller.listStudents);

// Admin: publicar / ocultar / regresar a borrador, y reactivar
router.patch('/:id/status', authenticate, requireRole(ADMIN), withId, validate(courseStatusSchema), controller.setStatus);
router.patch('/:id/restore', authenticate, requireRole(ADMIN), withId, controller.restore);

module.exports = router;
