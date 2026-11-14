const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('../src/repositories/user.repository');

const app = require('../src/app');
const userRepository = require('../src/repositories/user.repository');
const { USERS, authHeader, mockUsers } = require('./helpers');

beforeEach(() => {
  jest.resetAllMocks();
  mockUsers(userRepository);
});

describe('POST /api/v1/auth/register', () => {
  test('crea la cuenta siempre con rol "user" y devuelve un token', async () => {
    userRepository.create.mockResolvedValue(3);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ANA@test.com', password: 'Segura123' });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).not.toHaveProperty('passwordHash');

    const saved = userRepository.create.mock.calls[0][0];
    expect(saved.role).toBe('user');
    expect(saved.email).toBe('ana@test.com'); // se normaliza a minúsculas
    expect(saved.passwordHash).not.toBe('Segura123'); // nunca se guarda en texto plano
    expect(await bcrypt.compare('Segura123', saved.passwordHash)).toBe(true);
  });

  test('rechaza una contraseña débil con el detalle por campo', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@test.com', password: 'debil' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'password' })]));
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  test('no permite registrarse como administrador', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@test.com', password: 'Segura123', role: 'admin' });

    expect(res.status).toBe(400);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  test('un correo repetido responde 409', async () => {
    userRepository.create.mockRejectedValue(Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' }));

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@test.com', password: 'Segura123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  const passwordHash = bcrypt.hashSync('Segura123', 4);

  test('con credenciales correctas devuelve el token', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue({ ...USERS.student, passwordHash });

    const res = await request(app).post('/api/v1/auth/login').send({ email: 'ana@test.com', password: 'Segura123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  test('contraseña incorrecta y correo inexistente responden igual (no revela qué correos existen)', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValueOnce({ ...USERS.student, passwordHash });
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ana@test.com', password: 'Incorrecta1' });

    userRepository.findByEmailWithPassword.mockResolvedValueOnce(null);
    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nadie@test.com', password: 'Incorrecta1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  test('una cuenta deshabilitada no puede iniciar sesión', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue({ ...USERS.student, isActive: false, passwordHash });

    const res = await request(app).post('/api/v1/auth/login').send({ email: 'ana@test.com', password: 'Segura123' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/auth/me', () => {
  test('sin token responde 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  test('con un token alterado responde 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `${authHeader(USERS.student)}x`);
    expect(res.status).toBe(401);
  });

  test('con un token válido devuelve el usuario', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', authHeader(USERS.student));

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('ana@test.com');
  });

  test('si el admin deshabilita la cuenta, su token deja de funcionar de inmediato', async () => {
    mockUsers(userRepository, [{ ...USERS.student, isActive: false }]);

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', authHeader(USERS.student));

    expect(res.status).toBe(401);
  });
});
