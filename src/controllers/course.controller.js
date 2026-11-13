const courseService = require('../services/course.service');
const { sendSuccess } = require('../utils/response');

async function listCatalog(req, res) {
  const { items, meta } = await courseService.listCatalog(req.valid.query);
  sendSuccess(res, { data: items, meta });
}

async function getById(req, res) {
  const data = await courseService.getById(req.valid.params.id, req.user);
  sendSuccess(res, { data });
}

async function listMine(req, res) {
  const { items, meta } = await courseService.listMine(req.user, req.valid.query);
  sendSuccess(res, { data: items, meta });
}

async function listAll(req, res) {
  const { items, meta } = await courseService.listAll(req.valid.query);
  sendSuccess(res, { data: items, meta });
}

async function create(req, res) {
  const data = await courseService.create(req.user, req.valid.body);
  sendSuccess(res, { status: 201, message: 'Curso creado como borrador. Quedará visible cuando el administrador lo publique', data });
}

async function update(req, res) {
  const data = await courseService.update(req.user, req.valid.params.id, req.valid.body);
  sendSuccess(res, { message: 'Curso actualizado', data });
}

async function remove(req, res) {
  await courseService.remove(req.user, req.valid.params.id);
  sendSuccess(res, { message: 'Curso dado de baja' });
}

async function setStatus(req, res) {
  const data = await courseService.setStatus(req.valid.params.id, req.valid.body.status);
  sendSuccess(res, { message: `Estado del curso actualizado a "${data.status}"`, data });
}

async function restore(req, res) {
  const data = await courseService.restore(req.valid.params.id);
  sendSuccess(res, { message: 'Curso reactivado', data });
}

async function listStudents(req, res) {
  const data = await courseService.listStudents(req.user, req.valid.params.id);
  sendSuccess(res, { data });
}

module.exports = { listCatalog, getById, listMine, listAll, create, update, remove, setStatus, restore, listStudents };
