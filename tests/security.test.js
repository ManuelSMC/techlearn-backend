const request = require('supertest');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('../src/repositories/user.repository');

const app = require('../src/app');
const userRepository = require('../src/repositories/user.repository');

describe('Límite de intentos de inicio de sesión', () => {
  test('después de 10 intentos fallidos responde 429 (protección contra fuerza bruta)', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(null);
    const attempt = () =>
      request(app).post('/api/v1/auth/login').send({ email: 'ana@test.com', password: 'Incorrecta1' });

    for (let i = 0; i < 10; i += 1) {
      const res = await attempt();
      expect(res.status).toBe(401);
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
  });
});
