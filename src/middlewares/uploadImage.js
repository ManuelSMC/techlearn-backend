const multer = require('multer');
const AppError = require('../utils/AppError');

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Recibe un solo archivo en el campo "image" (multipart/form-data).
 * Se guarda en memoria, no en disco: el servidor de Railway no conserva archivos,
 * por eso la imagen se envía después a Cloudinary.
 */
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return callback(AppError.badRequest('Formato no permitido. Usa JPG, PNG o WEBP'));
    }
    return callback(null, true);
  },
}).single('image');

module.exports = { uploadImage, MAX_FILE_SIZE };
