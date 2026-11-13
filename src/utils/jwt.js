const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
    algorithm: 'HS256',
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };
