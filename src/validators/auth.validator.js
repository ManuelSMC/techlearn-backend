const { z } = require('zod');
const { passwordSchema, emailSchema, nameSchema } = require('./common.validator');

const registerSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

module.exports = { registerSchema, loginSchema };
