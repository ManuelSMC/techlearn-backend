const { z } = require('zod');
const { passwordSchema, emailSchema, nameSchema, urlSchema } = require('./common.validator');
const { ROLES } = require('../utils/constants');

const createInstructorSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  specialty: z.string().trim().max(100).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  photoUrl: urlSchema.optional().nullable(),
});

const updateInstructorProfileSchema = z
  .strictObject({
    specialty: z.string().trim().max(100).nullable(),
    bio: z.string().trim().max(2000).nullable(),
    photoUrl: urlSchema.nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envía al menos un campo para actualizar' });

const userStatusSchema = z.strictObject({
  isActive: z.boolean({ error: 'isActive debe ser true o false' }),
});

const usersQuerySchema = z.object({
  role: z.enum(Object.values(ROLES)).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const enrollSchema = z.strictObject({
  courseId: z.coerce.number().int().positive('Curso inválido'),
});

module.exports = {
  createInstructorSchema,
  updateInstructorProfileSchema,
  userStatusSchema,
  usersQuerySchema,
  enrollSchema,
};
