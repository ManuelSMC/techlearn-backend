/**
 * Formato estándar de respuesta: { success, message, data, meta }
 */
function sendSuccess(res, { status = 200, message = 'OK', data = null, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

module.exports = { sendSuccess };
