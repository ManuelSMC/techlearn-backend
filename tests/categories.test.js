const request = require('supertest');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('../src/repositories/user.repository');
jest.mock('../src/repositories/category.repository');

const app = require('../src/app');
const userRepository = require('../src/repositories/user.repository');
const categoryRepository = require('../src/repositories/category.repository');
const { USERS, authHeader, mockUsers } = require('./helpers');

beforeEach(() => {
  jest.resetAllMocks();
  mockUsers(userRepository);
});

describe('Categorías', () => {
  test('al crear una categoría, el slug se genera a partir del nombre', async () => {
    categoryRepository.create.mockResolvedValue(7);
    categoryRepository.findById.mockResolvedValue({ id: 7, name: 'Diseño UX', slug: 'diseno-ux', isActive: true });

    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', authHeader(USERS.admin))
      .send({ name: 'Diseño UX' });

    expect(res.status).toBe(201);
    expect(categoryRepository.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'diseno-ux' }));
  });

  test('solo el administrador puede crear categorías', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', authHeader(USERS.instructor))
      .send({ name: 'Diseño UX' });

    expect(res.status).toBe(403);
  });

  test('no se puede dar de baja una categoría con cursos activos', async () => {
    categoryRepository.findById.mockResolvedValue({ id: 1, name: 'Frontend', isActive: true });
    categoryRepository.countActiveCourses.mockResolvedValue(3);

    const res = await request(app).delete('/api/v1/categories/1').set('Authorization', authHeader(USERS.admin));

    expect(res.status).toBe(409);
    expect(categoryRepository.setActive).not.toHaveBeenCalled();
  });
});
