const instructorService = require('../services/instructor.service');
const { sendSuccess } = require('../utils/response');

async function listPublic(req, res) {
  const { items, meta } = await instructorService.listPublic(req.valid.query);
  sendSuccess(res, { data: items, meta });
}

async function getPublicProfile(req, res) {
  sendSuccess(res, { data: await instructorService.getPublicProfile(req.valid.params.id) });
}

async function getMyProfile(req, res) {
  sendSuccess(res, { data: await instructorService.getMyProfile(req.user) });
}

async function updateMyProfile(req, res) {
  const data = await instructorService.updateMyProfile(req.user, req.valid.body);
  sendSuccess(res, { message: 'Perfil actualizado', data });
}

module.exports = { listPublic, getPublicProfile, getMyProfile, updateMyProfile };
