const AppError = require('../utils/AppError');
const categoryRepository = require('../repositories/category.repository');

// "Data & Analytics" -> "data-analytics", "Diseño UX" -> "diseno-ux"
function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function findOrFail(id) {
  const category = await categoryRepository.findById(id);
  if (!category) throw AppError.notFound('Categoría no encontrada');
  return category;
}

function list({ includeInactive = false } = {}) {
  return categoryRepository.list({ includeInactive });
}

async function create({ name, slug, description, imageUrl }) {
  const finalSlug = slug || slugify(name);
  if (!finalSlug) throw AppError.badRequest('No se pudo generar un slug válido a partir del nombre');
  const id = await categoryRepository.create({ name, slug: finalSlug, description, imageUrl });
  return categoryRepository.findById(id);
}

async function update(id, data) {
  await findOrFail(id);
  await categoryRepository.update(id, data);
  return categoryRepository.findById(id);
}

/** Baja lógica. No se permite si la categoría todavía tiene cursos activos. */
async function remove(id) {
  const category = await findOrFail(id);
  if (!category.isActive) throw AppError.badRequest('La categoría ya está deshabilitada');
  const activeCourses = await categoryRepository.countActiveCourses(id);
  if (activeCourses > 0) {
    throw AppError.conflict(
      `No se puede dar de baja: la categoría tiene ${activeCourses} curso(s) activo(s). Reasígnalos o dalos de baja primero`
    );
  }
  await categoryRepository.setActive(id, false);
}

async function restore(id) {
  const category = await findOrFail(id);
  if (category.isActive) throw AppError.badRequest('La categoría ya está activa');
  await categoryRepository.setActive(id, true);
  return categoryRepository.findById(id);
}

module.exports = { list, create, update, remove, restore, slugify };
