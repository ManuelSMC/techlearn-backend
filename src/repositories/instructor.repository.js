const pool = require('../config/db');

async function create({ userId, bio, photoUrl, specialty }, db = pool) {
  const [result] = await db.query(
    'INSERT INTO instructors (user_id, bio, photo_url, specialty) VALUES (?, ?, ?, ?)',
    [userId, bio ?? null, photoUrl ?? null, specialty ?? null]
  );
  return result.insertId;
}

// Datos públicos del instructor: cursos publicados y estudiantes activos en ellos.
const PUBLIC_SELECT = `
  SELECT i.id, u.name, i.specialty, i.bio, i.photo_url AS photoUrl,
         COUNT(DISTINCT c.id) AS publishedCourses,
         COUNT(e.id) AS students
  FROM instructors i
  JOIN users u ON u.id = i.user_id AND u.is_active = TRUE
  LEFT JOIN courses c ON c.instructor_id = i.id AND c.status = 'published' AND c.is_active = TRUE
  LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'`;
const PUBLIC_GROUP = 'GROUP BY i.id, u.name, i.specialty, i.bio, i.photo_url';

/**
 * Directorio público: instructores activos con al menos un curso publicado.
 * Se ordena por número de cursos y estudiantes, así los primeros son los "destacados".
 */
async function listPublic({ search, page, limit }) {
  const params = [];
  let where = '';
  if (search) {
    where = 'WHERE (u.name LIKE ? OR i.specialty LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const [rows] = await pool.query(
    `${PUBLIC_SELECT} ${where} ${PUBLIC_GROUP}
     HAVING publishedCourses > 0
     ORDER BY publishedCourses DESC, students DESC, u.name
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM (
       ${PUBLIC_SELECT} ${where} ${PUBLIC_GROUP} HAVING publishedCourses > 0
     ) AS visible`,
    params
  );
  return { items: rows, total };
}

/** Perfil público de un instructor activo (aunque todavía no tenga cursos publicados). */
async function findPublicById(id) {
  const [rows] = await pool.query(`${PUBLIC_SELECT} WHERE i.id = ? ${PUBLIC_GROUP}`, [id]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT i.id, i.user_id AS userId, u.name, u.email, i.specialty, i.bio, i.photo_url AS photoUrl
     FROM instructors i JOIN users u ON u.id = i.user_id
     WHERE i.id = ?`,
    [id]
  );
  return rows[0] || null;
}

const PROFILE_COLUMNS = { specialty: 'specialty', bio: 'bio', photoUrl: 'photo_url' };

async function updateProfile(id, data) {
  const fields = Object.keys(data).filter((key) => key in PROFILE_COLUMNS);
  if (fields.length === 0) return;
  const set = fields.map((key) => `${PROFILE_COLUMNS[key]} = ?`).join(', ');
  await pool.query(`UPDATE instructors SET ${set} WHERE id = ?`, [...fields.map((key) => data[key]), id]);
}

module.exports = { create, listPublic, findPublicById, findById, updateProfile };
