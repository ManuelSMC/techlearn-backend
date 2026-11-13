const AppError = require('../utils/AppError');

/**
 * Valida body, query o params con un esquema de Zod.
 * Los datos ya validados y limpios quedan en req.valid[source].
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      throw AppError.badRequest('Datos inválidos', details);
    }
    req.valid = { ...req.valid, [source]: result.data };
    next();
  };
}

module.exports = validate;
