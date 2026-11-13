const pool = require('../config/db');

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, user_id AS userId, course_id AS courseId, status, enrolled_at AS enrolledAt FROM enrollments WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function findByUserAndCourse(userId, courseId) {
  const [rows] = await pool.query(
    'SELECT id, user_id AS userId, course_id AS courseId, status FROM enrollments WHERE user_id = ? AND course_id = ?',
    [userId, courseId]
  );
  return rows[0] || null;
}

async function create(userId, courseId) {
  const [result] = await pool.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [userId, courseId]);
  return result.insertId;
}

async function setStatus(id, status) {
  await pool.query('UPDATE enrollments SET status = ? WHERE id = ?', [status, id]);
}

async function listByUser(userId) {
  const [rows] = await pool.query(
    `SELECT e.id, e.status, e.enrolled_at AS enrolledAt,
            co.id AS courseId, co.title, co.image_url AS imageUrl, co.price, co.level,
            ca.name AS categoryName, u.name AS instructorName
     FROM enrollments e
     JOIN courses co ON co.id = e.course_id
     JOIN categories ca ON ca.id = co.category_id
     JOIN instructors i ON i.id = co.instructor_id
     JOIN users u ON u.id = i.user_id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    enrolledAt: row.enrolledAt,
    course: {
      id: row.courseId,
      title: row.title,
      imageUrl: row.imageUrl,
      price: row.price,
      level: row.level,
      categoryName: row.categoryName,
      instructorName: row.instructorName,
    },
  }));
}

module.exports = { findById, findByUserAndCourse, create, setStatus, listByUser };
