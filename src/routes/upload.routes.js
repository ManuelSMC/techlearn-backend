const { Router } = require('express');
const { z } = require('zod');
const controller = require('../controllers/upload.controller');
const validate = require('../middlewares/validate');
const requireRole = require('../middlewares/requireRole');
const { authenticate } = require('../middlewares/auth');
const { uploadImage } = require('../middlewares/uploadImage');
const { ROLES } = require('../utils/constants');

const router = Router();

// Carpeta de Cloudinary donde se guarda la imagen, según su uso
const uploadSchema = z.object({
  folder: z.enum(['courses', 'categories', 'instructors'], { error: 'Carpeta de imagen no válida' }),
});

// Instructores (portadas de cursos y su foto) y admin (categorías y fotos de instructores)
router.post(
  '/images',
  authenticate,
  requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN),
  uploadImage,
  validate(uploadSchema),
  controller.uploadImage
);

module.exports = router;
