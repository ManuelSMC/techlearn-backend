const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

async function register(req, res) {
  const data = await authService.register(req.valid.body);
  sendSuccess(res, { status: 201, message: 'Cuenta creada correctamente', data });
}

async function login(req, res) {
  const data = await authService.login(req.valid.body);
  sendSuccess(res, { message: 'Inicio de sesión exitoso', data });
}

function me(req, res) {
  sendSuccess(res, { data: req.user });
}

module.exports = { register, login, me };
