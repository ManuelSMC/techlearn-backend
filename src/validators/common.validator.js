const { z } = require('zod');

// Mensajes de error genéricos de Zod en español.
z.config(z.locales.es());

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un número positivo'),
});

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar 72 caracteres')
  .regex(/[a-z]/, 'La contraseña debe incluir una minúscula')
  .regex(/[A-Z]/, 'La contraseña debe incluir una mayúscula')
  .regex(/\d/, 'La contraseña debe incluir un número');

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Correo electrónico inválido').max(150));

const nameSchema = z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100);

const urlSchema = z.url('Debe ser una URL válida').max(255);

module.exports = { idParamSchema, passwordSchema, emailSchema, nameSchema, urlSchema };
