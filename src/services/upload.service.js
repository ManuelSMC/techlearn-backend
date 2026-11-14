const { v2: cloudinary } = require('cloudinary');
const AppError = require('../utils/AppError');
const env = require('../config/env');

// El SDK toma las credenciales de la variable CLOUDINARY_URL.
cloudinary.config({ secure: true });

const MAX_SIZE_PX = 1600;

/**
 * Revisa los primeros bytes del archivo ("firma") para confirmar que de verdad es una imagen.
 * El tipo que manda el navegador (mimetype) se puede falsificar; el contenido no.
 */
function detectImageType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Sube la imagen a Cloudinary y devuelve su URL pública (https). */
function uploadImage(buffer, folder) {
  if (!env.cloudinaryUrl) {
    throw new AppError(503, 'La carga de imágenes no está disponible en este momento');
  }
  if (!detectImageType(buffer)) {
    throw AppError.badRequest('El archivo no es una imagen válida (usa JPG, PNG o WEBP)');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `techlearn/${folder}`,
        resource_type: 'image',
        // Se reduce si es muy grande, para que las páginas carguen rápido
        transformation: [{ width: MAX_SIZE_PX, height: MAX_SIZE_PX, crop: 'limit' }],
      },
      (error, result) => {
        if (error) return reject(new AppError(502, 'No se pudo subir la imagen. Intenta de nuevo'));
        return resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { uploadImage, detectImageType };
