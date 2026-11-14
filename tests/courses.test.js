const request = require('supertest');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('../src/repositories/user.repository');
jest.mock('../src/repositories/course.repository');
jest.mock('../src/repositories/category.repository');
jest.mock('../src/repositories/enrollment.repository');

const app = require('../src/app');
const userRepository = require('../src/repositories/user.repository');
const courseRepository = require('../src/repositories/course.repository');
const categoryRepository = require('../src/repositories/category.repository');
const enrollmentRepository = require('../src/repositories/enrollment.repository');
const { USERS, authHeader, mockUsers, buildCourse } = require('./helpers');

const newCourse = {
  title: 'Node.js desde cero',
  description: 'Construye APIs REST con Node.js y Express.',
  price: 299,
  level: 'beginner',
  categoryId: 1,
};

beforeEach(() => {
  jest.resetAllMocks();
  mockUsers(userRepository);
  categoryRepository.findById.mockResolvedValue({ id: 1, name: 'Frontend', isActive: true });
});

describe('GET /api/v1/courses (catálogo público)', () => {
  test('solo pide cursos publicados y devuelve la paginación', async () => {
    courseRepository.list.mockResolvedValue({ items: [buildCourse({ status: 'published' })], total: 8 });

    const res = await request(app).get('/api/v1/courses?category=frontend&page=1&limit=6');

    expect(res.status).toBe(200);
    expect(courseRepository.list).toHaveBeenCalledWith(expect.objectContaining({ publicOnly: true, category: 'frontend' }));
    expect(res.body.meta).toEqual({ page: 1, limit: 6, total: 8, totalPages: 2, hasMore: true });
  });

  test('rechaza un límite mayor al permitido', async () => {
    const res = await request(app).get('/api/v1/courses?limit=500');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/courses', () => {
  test('el instructor crea un curso como borrador y a su nombre (tomado del token)', async () => {
    courseRepository.create.mockResolvedValue(5);
    courseRepository.findById.mockResolvedValue(buildCourse());

    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', authHeader(USERS.instructor))
      .send(newCourse);

    expect(res.status).toBe(201);
    expect(courseRepository.create).toHaveBeenCalledWith(expect.objectContaining({ instructorId: 10 }));
    expect(res.body.data.status).toBe('draft');
  });

  test('el instructor no puede publicar su propio curso al crearlo', async () => {
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', authHeader(USERS.instructor))
      .send({ ...newCourse, status: 'published' });

    expect(res.status).toBe(400);
    expect(courseRepository.create).not.toHaveBeenCalled();
  });

  test('un estudiante no puede crear cursos', async () => {
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', authHeader(USERS.student))
      .send(newCourse);

    expect(res.status).toBe(403);
  });

  test('sin sesión responde 401', async () => {
    const res = await request(app).post('/api/v1/courses').send(newCourse);
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/v1/courses/:id', () => {
  test('un instructor no puede editar el curso de otro instructor', async () => {
    courseRepository.findById.mockResolvedValue(buildCourse());

    const res = await request(app)
      .put('/api/v1/courses/5')
      .set('Authorization', authHeader(USERS.otherInstructor))
      .send({ title: 'Título cambiado' });

    expect(res.status).toBe(403);
    expect(courseRepository.update).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/courses/:id', () => {
  test('un curso en borrador no es visible para los visitantes', async () => {
    courseRepository.findById.mockResolvedValue(buildCourse({ status: 'draft' }));

    const res = await request(app).get('/api/v1/courses/5');

    // 404 y no 403: no se revela que el curso existe
    expect(res.status).toBe(404);
  });

  test('el instructor dueño sí puede ver su borrador', async () => {
    courseRepository.findById.mockResolvedValue(buildCourse({ status: 'draft' }));

    const res = await request(app).get('/api/v1/courses/5').set('Authorization', authHeader(USERS.instructor));

    expect(res.status).toBe(200);
  });

  test('un estudiante inscrito sigue viendo el curso aunque se oculte del catálogo', async () => {
    courseRepository.findById.mockResolvedValue(buildCourse({ status: 'hidden' }));
    enrollmentRepository.findByUserAndCourse.mockResolvedValue({ id: 1, status: 'active' });

    const res = await request(app).get('/api/v1/courses/5').set('Authorization', authHeader(USERS.student));

    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/v1/courses/:id/status', () => {
  test('solo el administrador publica cursos', async () => {
    courseRepository.findById.mockResolvedValue(buildCourse());

    const asInstructor = await request(app)
      .patch('/api/v1/courses/5/status')
      .set('Authorization', authHeader(USERS.instructor))
      .send({ status: 'published' });
    const asAdmin = await request(app)
      .patch('/api/v1/courses/5/status')
      .set('Authorization', authHeader(USERS.admin))
      .send({ status: 'published' });

    expect(asInstructor.status).toBe(403);
    expect(asAdmin.status).toBe(200);
    expect(courseRepository.setStatus).toHaveBeenCalledWith(5, 'published');
  });
});
