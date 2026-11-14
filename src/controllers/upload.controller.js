const AppError = require('../utils/AppError');
const uploadService = require('../services/upload.service');
const { sendSuccess } = require('../utils/response');

async function uploadImage(req, res) {
  if (!req.file) throw AppError.badRequest('Selecciona una imagen');
  const url = await uploadService.uploadImage(req.file.buffer, req.valid.body.folder);
  sendSuccess(res, { status: 201, message: 'Imagen subida', data: { url } });
}

module.exports = { uploadImage };
