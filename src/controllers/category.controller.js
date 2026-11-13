const categoryService = require('../services/category.service');
const { sendSuccess } = require('../utils/response');

async function list(req, res) {
  sendSuccess(res, { data: await categoryService.list() });
}

async function listAll(req, res) {
  sendSuccess(res, { data: await categoryService.list({ includeInactive: true }) });
}

async function create(req, res) {
  const data = await categoryService.create(req.valid.body);
  sendSuccess(res, { status: 201, message: 'Categoría creada', data });
}

async function update(req, res) {
  const data = await categoryService.update(req.valid.params.id, req.valid.body);
  sendSuccess(res, { message: 'Categoría actualizada', data });
}

async function remove(req, res) {
  await categoryService.remove(req.valid.params.id);
  sendSuccess(res, { message: 'Categoría dada de baja' });
}

async function restore(req, res) {
  const data = await categoryService.restore(req.valid.params.id);
  sendSuccess(res, { message: 'Categoría reactivada', data });
}

module.exports = { list, listAll, create, update, remove, restore };
