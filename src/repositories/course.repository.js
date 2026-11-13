const pool = require('../config/db');

const BASE_SELECT = `
  SELECT co.id, co.title, co.description, co.price, co.level, co.image_url AS imageUrl,
         co.status, co.is_active AS isActive, co.created_at AS createdAt, co.updated_at AS updatedAt,
         ca.id AS categoryId, ca.name AS categoryName, ca.slug AS categorySlug,
         i.id AS instructorId, u.name AS instructorName, i.photo_url AS instructorPhotoUrl,
         (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = co.id AND e.status = 'active') AS studentsCount
  FROM courses co
  JOIN categories ca ON ca.id = co.category_id
  JOIN instructors i ON i.id = co.instructor_id
  JOIN users u ON u.id = i.user_id`;

function mapCourse(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    isFree: row.price === 0,
    level: row.level,
    imageUrl: row.imageUrl,
    status: row.status,
    isActive: Boolean(row.isActive),
    studentsCount: row.studentsCount,
    category: { id: row.categoryId, name: row.categoryName, slug: row.categorySlug },
    instructor: { id: row.instructorId, name: row.instructorName, photoUrl: row.instructorPhotoUrl },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Construye el WHERE dinámico con parámetros (nunca concatenando valores del usuario).
 * publicOnly: solo cursos publicados, activos, de categorías e instructores activos.
 */
function buildFilters({ publicOnly, instructorId, category, price, level, search, status, includeInactive, onlyInactive }) {
  const conditions = [];
  const params = [];

  if (publicOnly) {
    conditions.push("co.status = 'published'", 'co.is_active = TRUE', 'ca.is_active = TRUE', 'u.is_active = TRUE');
  } else if (onlyInactive) {
    conditions.push('co.is_active = FALSE');
  } else if (!includeInactive) {
    conditions.push('co.is_active = TRUE');
  }
  if (instructorId) {
    conditions.push('co.instructor_id = ?');
    params.push(instructorId);
  }
  if (category) {
    conditions.push('ca.slug = ?');
    params.push(category);
  }
  if (price === 'free') conditions.push('co.price = 0');
  if (price === 'paid') conditions.push('co.price > 0');
  if (level) {
    conditions.push('co.level = ?');
    params.push(level);
  }
  if (status) {
    conditions.push('co.status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(co.title LIKE ? OR co.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

async function list(filters) {
  const { page, limit } = filters;
  const { where, params } = buildFilters(filters);

  const [rows] = await pool.query(`${BASE_SELECT} ${where} ORDER BY co.created_at DESC, co.id DESC LIMIT ? OFFSET ?`, [
    ...params,
    limit,
    (page - 1) * limit,
  ]);
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM courses co
     JOIN categories ca ON ca.id = co.category_id
     JOIN instructors i ON i.id = co.instructor_id
     JOIN users u ON u.id = i.user_id
     ${where}`,
    params
  );
  return { items: rows.map(mapCourse), total };
}

async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE co.id = ?`, [id]);
  return mapCourse(rows[0]);
}

async function create({ title, description, price, level, imageUrl, categoryId, instructorId }) {
  const [result] = await pool.query(
    `INSERT INTO courses (title, description, price, level, image_url, category_id, instructor_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, description, price, level, imageUrl ?? null, categoryId, instructorId]
  );
  return result.insertId;
}

// Mapa de campos permitidos -> columnas (evita inyectar nombres de columna desde el cliente).
const UPDATABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  price: 'price',
  level: 'level',
  imageUrl: 'image_url',
  categoryId: 'category_id',
};

async function update(id, data) {
  const fields = Object.keys(data).filter((key) => key in UPDATABLE_COLUMNS && data[key] !== undefined);
  if (fields.length === 0) return;
  const set = fields.map((key) => `${UPDATABLE_COLUMNS[key]} = ?`).join(', ');
  await pool.query(`UPDATE courses SET ${set} WHERE id = ?`, [...fields.map((key) => data[key]), id]);
}

async function setStatus(id, status) {
  await pool.query('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
}

async function setActive(id, isActive) {
  await pool.query('UPDATE courses SET is_active = ? WHERE id = ?', [isActive, id]);
}

async function listStudents(courseId) {
  const [rows] = await pool.query(
    `SELECT e.id AS enrollmentId, u.id AS userId, u.name, u.email, e.status, e.enrolled_at AS enrolledAt
     FROM enrollments e JOIN users u ON u.id = e.user_id
     WHERE e.course_id = ?
     ORDER BY e.enrolled_at DESC`,
    [courseId]
  );
  return rows;
}

module.exports = { list, findById, create, update, setStatus, setActive, listStudents };
