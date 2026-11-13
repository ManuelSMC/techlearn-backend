const { z } = require('zod');
const { urlSchema } = require('./common.validator');
const { COURSE_LEVELS, COURSE_STATUS } = require('../utils/constants');

// strictObject rechaza campos no permitidos (p. ej. que un instructor intente enviar "status").
const createCourseSchema = z.strictObject({
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(150),
  description: z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres').max(5000),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo').max(99999999.99),
  level: z.enum(COURSE_LEVELS, { error: `El nivel debe ser: ${COURSE_LEVELS.join(', ')}` }),
  imageUrl: urlSchema.optional().nullable(),
  categoryId: z.coerce.number().int().positive('Categoría inválida'),
});

const updateCourseSchema = createCourseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envía al menos un campo para actualizar' });

const courseStatusSchema = z.strictObject({
  status: z.enum(Object.values(COURSE_STATUS), {
    error: `El estado debe ser: ${Object.values(COURSE_STATUS).join(', ')}`,
  }),
});

const catalogQuerySchema = z.object({
  category: z.string().trim().max(60).optional(),
  price: z.enum(['free', 'paid']).optional(),
  level: z.enum(COURSE_LEVELS).optional(),
  search: z.string().trim().max(100).optional(),
  instructor: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(6),
});

const adminCoursesQuerySchema = catalogQuerySchema.extend({
  status: z.enum(Object.values(COURSE_STATUS)).optional(),
  includeInactive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  // Solo los cursos dados de baja (para revisarlos o reactivarlos)
  onlyInactive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

module.exports = {
  createCourseSchema,
  updateCourseSchema,
  courseStatusSchema,
  catalogQuerySchema,
  adminCoursesQuerySchema,
};
