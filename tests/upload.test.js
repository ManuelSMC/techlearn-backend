const request = require('supertest');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('../src/repositories/user.repository');
// Cloudinary simulado: no se sube nada a internet durante las pruebas
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => ({
        end: () => callback(null, { secure_url: 'https://res.cloudinary.com/demo/image/upload/curso.png' }),
      })),
    },
  },
}));

const app = require('../src/app');
const { v2: cloudinary } = require('cloudinary');
const userRepository = require('../src/repositories/user.repository');
const { USERS, authHeader, mockUsers } = require('./helpers');

// Bytes iniciales reales de un PNG (su "firma") más algo de contenido
const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(64)]);

const upload = (user, { folder = 'courses', file = PNG, filename = 'portada.png', contentType = 'image/png' } = {}) => {
  const req = request(app).post('/api/v1/uploads/images');
  if (user) req.set('Authorization', authHeader(user));
  return req.field('folder', folder).attach('image', file, { filename, contentType });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUsers(userRepository);
});

describe('POST /api/v1/uploads/images', () => {
  test('un instructor sube una imagen y recibe su URL', async () => {
    const res = await upload(USERS.instructor);

    expect(res.status).toBe(201);
    expect(res.body.data.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'techlearn/courses' }),
      expect.any(Function)
    );
  });

  test('sin sesión responde 401', async () => {
    const res = await upload(null);
    expect(res.status).toBe(401);
  });

  test('un estudiante no puede subir imágenes', async () => {
    const res = await upload(USERS.student);
    expect(res.status).toBe(403);
  });

  test('rechaza archivos que no son imágenes', async () => {
    const res = await upload(USERS.instructor, { file: Buffer.from('hola'), filename: 'nota.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  test('rechaza un archivo disfrazado de imagen (revisa el contenido, no solo la extensión)', async () => {
    const fake = Buffer.from('<script>alert(1)</script> esto no es una imagen');
    const res = await upload(USERS.instructor, { file: fake });

    expect(res.status).toBe(400);
    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  test('rechaza imágenes de más de 2 MB', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
    const res = await upload(USERS.instructor, { file: big });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('La imagen no puede pesar más de 2 MB');
  });

  test('solo acepta las carpetas permitidas', async () => {
    const res = await upload(USERS.admin, { folder: 'otra-carpeta' });
    expect(res.status).toBe(400);
  });
});
