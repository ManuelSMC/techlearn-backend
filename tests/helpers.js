const { signToken } = require('../src/utils/jwt');

// Usuarios de prueba, con la misma forma que devuelve userRepository.findById
const USERS = {
  admin: { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin', isActive: true, instructorId: null },
  instructor: { id: 2, name: 'Carlos', email: 'carlos@test.com', role: 'instructor', isActive: true, instructorId: 10 },
  otherInstructor: { id: 4, name: 'Laura', email: 'laura@test.com', role: 'instructor', isActive: true, instructorId: 20 },
  student: { id: 3, name: 'Ana', email: 'ana@test.com', role: 'user', isActive: true, instructorId: null },
};

/** Header Authorization con un token válido para el usuario. */
const authHeader = (user) => `Bearer ${signToken(user)}`;

/** Hace que el middleware authenticate encuentre a los usuarios de prueba. */
function mockUsers(userRepository, users = Object.values(USERS)) {
  userRepository.findById.mockImplementation(async (id) => users.find((user) => user.id === Number(id)) ?? null);
}

function buildCourse(overrides = {}) {
  return {
    id: 5,
    title: 'React desde cero',
    description: 'Aprende los fundamentos de React.',
    price: 499,
    isFree: false,
    level: 'beginner',
    imageUrl: null,
    status: 'draft',
    isActive: true,
    studentsCount: 0,
    category: { id: 1, name: 'Frontend', slug: 'frontend' },
    instructor: { id: 10, name: 'Carlos', photoUrl: null },
    ...overrides,
  };
}

module.exports = { USERS, authHeader, mockUsers, buildCourse };
