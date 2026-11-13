const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/response');

async function list(req, res) {
  const { items, meta } = await userService.list(req.valid.query);
  sendSuccess(res, { data: items, meta });
}

async function createInstructor(req, res) {
  const data = await userService.createInstructor(req.valid.body);
  sendSuccess(res, { status: 201, message: 'Instructor registrado', data });
}

async function setStatus(req, res) {
  const data = await userService.setStatus(req.user, req.valid.params.id, req.valid.body.isActive);
  sendSuccess(res, { message: data.isActive ? 'Usuario habilitado' : 'Usuario deshabilitado', data });
}

module.exports = { list, createInstructor, setStatus };
