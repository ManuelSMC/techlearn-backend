const pool = require('../config/db');

async function create({ userId, bio, photoUrl, specialty }, db = pool) {
  const [result] = await db.query(
    'INSERT INTO instructors (user_id, bio, photo_url, specialty) VALUES (?, ?, ?, ?)',
    [userId, bio ?? null, photoUrl ?? null, specialty ?? null]
  );
  return result.insertId;
}

// Instructores con cuenta activa y al menos un curso publicado (para la sección pública).
async function listPublic({ limit }) {
  const [rows] = await pool.query(
    `SELECT i.id, u.name, i.specialty, i.bio, i.photo_url AS photoUrl,
            COUNT(c.id) AS publishedCourses
     FROM instructors i
     JOIN users u ON u.id = i.user_id AND u.is_active = TRUE
     JOIN courses c ON c.instructor_id = i.id AND c.status = 'published' AND c.is_active = TRUE
     GROUP BY i.id, u.name, i.specialty, i.bio, i.photo_url
     ORDER BY publishedCourses DESC, u.name
     LIMIT ?`,
    [limit]
  );
  return rows;
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

module.exports = { create, listPublic, findById, updateProfile };
