const instructorService = require('../services/instructor.service');
const { sendSuccess } = require('../utils/response');

async function listPublic(req, res) {
  sendSuccess(res, { data: await instructorService.listPublic({ limit: 3 }) });
}

async function getMyProfile(req, res) {
  sendSuccess(res, { data: await instructorService.getMyProfile(req.user) });
}

async function updateMyProfile(req, res) {
  const data = await instructorService.updateMyProfile(req.user, req.valid.body);
  sendSuccess(res, { message: 'Perfil actualizado', data });
}

module.exports = { listPublic, getMyProfile, updateMyProfile };
