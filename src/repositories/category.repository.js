const pool = require('../config/db');

const BASE_SELECT = `
  SELECT c.id, c.name, c.slug, c.description, c.is_active AS isActive,
         COUNT(co.id) AS publishedCourses
  FROM categories c
  LEFT JOIN courses co ON co.category_id = c.id AND co.status = 'published' AND co.is_active = TRUE`;

function mapCategory(row) {
  if (!row) return null;
  return { ...row, isActive: Boolean(row.isActive) };
}

async function list({ includeInactive = false } = {}) {
  const where = includeInactive ? '' : 'WHERE c.is_active = TRUE';
  const [rows] = await pool.query(`${BASE_SELECT} ${where} GROUP BY c.id ORDER BY c.name`);
  return rows.map(mapCategory);
}

async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE c.id = ? GROUP BY c.id`, [id]);
  return mapCategory(rows[0]);
}

async function create({ name, slug, description }) {
  const [result] = await pool.query('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [
    name,
    slug,
    description ?? null,
  ]);
  return result.insertId;
}

async function update(id, { name, slug, description }) {
  const updates = { name, slug, description };
  const fields = Object.keys(updates).filter((key) => updates[key] !== undefined);
  if (fields.length === 0) return;
  const set = fields.map((key) => `${key} = ?`).join(', ');
  await pool.query(`UPDATE categories SET ${set} WHERE id = ?`, [...fields.map((key) => updates[key]), id]);
}

async function setActive(id, isActive) {
  await pool.query('UPDATE categories SET is_active = ? WHERE id = ?', [isActive, id]);
}

// Cursos activos (en cualquier estado) que dependen de la categoría.
async function countActiveCourses(id) {
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM courses WHERE category_id = ? AND is_active = TRUE',
    [id]
  );
  return total;
}

module.exports = { list, findById, create, update, setActive, countActiveCourses };
