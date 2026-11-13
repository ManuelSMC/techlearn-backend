const enrollmentService = require('../services/enrollment.service');
const { sendSuccess } = require('../utils/response');

async function enroll(req, res) {
  const { enrollment, paymentSimulated } = await enrollmentService.enroll(req.user, req.valid.body.courseId);
  const message = paymentSimulated ? 'Inscripción registrada (pago simulado)' : 'Inscripción registrada';
  sendSuccess(res, { status: 201, message, data: enrollment });
}

async function listMine(req, res) {
  sendSuccess(res, { data: await enrollmentService.listMine(req.user) });
}

async function cancel(req, res) {
  const data = await enrollmentService.cancel(req.user, req.valid.params.id);
  sendSuccess(res, { message: 'Inscripción cancelada', data });
}

module.exports = { enroll, listMine, cancel };
