const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
