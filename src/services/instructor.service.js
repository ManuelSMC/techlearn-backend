const AppError = require('../utils/AppError');
const instructorRepository = require('../repositories/instructor.repository');

function listPublic({ limit = 3 } = {}) {
  return instructorRepository.listPublic({ limit });
}

async function getMyProfile(user) {
  if (!user.instructorId) throw AppError.forbidden('Tu cuenta no tiene un perfil de instructor');
  return instructorRepository.findById(user.instructorId);
}

async function updateMyProfile(user, data) {
  if (!user.instructorId) throw AppError.forbidden('Tu cuenta no tiene un perfil de instructor');
  await instructorRepository.updateProfile(user.instructorId, data);
  return instructorRepository.findById(user.instructorId);
}

module.exports = { listPublic, getMyProfile, updateMyProfile };
