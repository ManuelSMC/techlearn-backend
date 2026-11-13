const AppError = require('../utils/AppError');
const { COURSE_STATUS, ENROLLMENT_STATUS } = require('../utils/constants');
const courseRepository = require('../repositories/course.repository');
const enrollmentRepository = require('../repositories/enrollment.repository');

async function enroll(user, courseId) {
  const course = await courseRepository.findById(courseId);
  if (!course || !course.isActive || course.status !== COURSE_STATUS.PUBLISHED) {
    throw AppError.notFound('Curso no disponible');
  }

  const existing = await enrollmentRepository.findByUserAndCourse(user.id, courseId);
  if (existing?.status === ENROLLMENT_STATUS.ACTIVE) {
    throw AppError.conflict('Ya estás inscrito en este curso');
  }

  let enrollmentId;
  if (existing) {
    // Reinscripción: se reactiva el registro existente para conservar el historial.
    await enrollmentRepository.setStatus(existing.id, ENROLLMENT_STATUS.ACTIVE);
    enrollmentId = existing.id;
  } else {
    enrollmentId = await enrollmentRepository.create(user.id, courseId);
  }

  return {
    enrollment: await enrollmentRepository.findById(enrollmentId),
    // Sin pasarela de pago en esta versión: los cursos de pago registran un pago simulado.
    paymentSimulated: !course.isFree,
  };
}

function listMine(user) {
  return enrollmentRepository.listByUser(user.id);
}

async function cancel(user, enrollmentId) {
  const enrollment = await enrollmentRepository.findById(enrollmentId);
  if (!enrollment || enrollment.userId !== user.id) throw AppError.notFound('Inscripción no encontrada');
  if (enrollment.status === ENROLLMENT_STATUS.CANCELLED) throw AppError.badRequest('La inscripción ya está cancelada');
  await enrollmentRepository.setStatus(enrollmentId, ENROLLMENT_STATUS.CANCELLED);
  return enrollmentRepository.findById(enrollmentId);
}

module.exports = { enroll, listMine, cancel };
