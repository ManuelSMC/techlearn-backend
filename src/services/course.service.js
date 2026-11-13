const AppError = require('../utils/AppError');
const { ROLES, COURSE_STATUS } = require('../utils/constants');
const { buildPaginationMeta } = require('../utils/pagination');
const courseRepository = require('../repositories/course.repository');
const categoryRepository = require('../repositories/category.repository');

const isAdmin = (user) => user?.role === ROLES.ADMIN;
const isOwner = (user, course) => Boolean(user?.instructorId) && user.instructorId === course.instructor.id;

async function paginate(filters) {
  const { items, total } = await courseRepository.list(filters);
  return { items, meta: buildPaginationMeta(filters.page, filters.limit, total) };
}

async function findActiveCourse(id) {
  const course = await courseRepository.findById(id);
  if (!course || !course.isActive) throw AppError.notFound('Curso no encontrado');
  return course;
}

/** Verificación de propiedad: solo el instructor dueño (o el admin, si se permite) puede continuar. */
function assertOwnerOrAdmin(user, course, { allowAdmin }) {
  if (isOwner(user, course)) return;
  if (allowAdmin && isAdmin(user)) return;
  throw AppError.forbidden('Solo puedes gestionar tus propios cursos');
}

async function assertCategoryAvailable(categoryId) {
  const category = await categoryRepository.findById(categoryId);
  if (!category || !category.isActive) throw AppError.badRequest('La categoría no existe o está deshabilitada');
}

function getInstructorId(user) {
  if (!user.instructorId) throw AppError.forbidden('Tu cuenta no tiene un perfil de instructor');
  return user.instructorId;
}

// ----- Público -----

function listCatalog(query) {
  return paginate({ ...query, publicOnly: true });
}

/** Un curso no publicado solo lo pueden ver su instructor y el admin. */
async function getById(id, user) {
  const course = await courseRepository.findById(id);
  const isPublic = course && course.isActive && course.status === COURSE_STATUS.PUBLISHED;
  if (isPublic) return course;
  if (course && (isAdmin(user) || (course.isActive && isOwner(user, course)))) return course;
  throw AppError.notFound('Curso no encontrado');
}

// ----- Instructor -----

function listMine(user, query) {
  return paginate({ ...query, instructorId: getInstructorId(user) });
}

async function create(user, data) {
  const instructorId = getInstructorId(user);
  await assertCategoryAvailable(data.categoryId);
  // Todo curso nuevo nace como borrador (draft) hasta que el admin lo publique.
  const id = await courseRepository.create({ ...data, instructorId });
  return courseRepository.findById(id);
}

async function update(user, id, data) {
  const course = await findActiveCourse(id);
  assertOwnerOrAdmin(user, course, { allowAdmin: false }); // el admin no edita contenido
  if (data.categoryId !== undefined && data.categoryId !== course.category.id) {
    await assertCategoryAvailable(data.categoryId);
  }
  await courseRepository.update(id, data);
  return courseRepository.findById(id);
}

/** Baja lógica: el dueño o el admin (moderación). */
async function remove(user, id) {
  const course = await findActiveCourse(id);
  assertOwnerOrAdmin(user, course, { allowAdmin: true });
  await courseRepository.setActive(id, false);
}

async function listStudents(user, id) {
  const course = await findActiveCourse(id);
  assertOwnerOrAdmin(user, course, { allowAdmin: true });
  return courseRepository.listStudents(id);
}

// ----- Admin -----

function listAll(query) {
  return paginate(query);
}

async function setStatus(id, status) {
  await findActiveCourse(id);
  await courseRepository.setStatus(id, status);
  return courseRepository.findById(id);
}

async function restore(id) {
  const course = await courseRepository.findById(id);
  if (!course) throw AppError.notFound('Curso no encontrado');
  if (course.isActive) throw AppError.badRequest('El curso ya está activo');
  await courseRepository.setActive(id, true);
  return courseRepository.findById(id);
}

module.exports = { listCatalog, getById, listMine, create, update, remove, listStudents, listAll, setStatus, restore };
