const { z } = require('zod');
const { urlSchema } = require('./common.validator');

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede tener minúsculas, números y guiones')
  .max(60);

const createCategorySchema = z.strictObject({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  slug: slugSchema.optional(),
  description: z.string().trim().max(255).optional().nullable(),
  imageUrl: urlSchema.optional().nullable(),
});

const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envía al menos un campo para actualizar' });

module.exports = { createCategorySchema, updateCategorySchema };
