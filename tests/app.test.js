const request = require('supertest');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const app = require('../src/app');

describe('Aplicación', () => {
  test('GET /api/v1/health responde que la API funciona', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'API TechLearn funcionando' });
  });

  test('una ruta inexistente responde 404 en formato JSON', async () => {
    const res = await request(app).get('/api/v1/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('un JSON mal formado responde 400 sin romper el servidor', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El cuerpo de la petición no es un JSON válido');
  });

  test('Helmet agrega cabeceras de seguridad y se oculta X-Powered-By', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
