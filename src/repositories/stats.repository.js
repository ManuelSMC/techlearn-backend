const pool = require('../config/db');

async function getTotals() {
  const [[row]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'user' AND u.is_active = TRUE) AS students,
      (SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'instructor' AND u.is_active = TRUE) AS instructors,
      (SELECT COUNT(*) FROM courses WHERE is_active = TRUE) AS courses,
      (SELECT COUNT(*) FROM courses WHERE is_active = TRUE AND status = 'published') AS publishedCourses,
      (SELECT COUNT(*) FROM courses WHERE is_active = TRUE AND status = 'draft') AS pendingReview,
      (SELECT COUNT(*) FROM enrollments WHERE status = 'active') AS activeEnrollments,
      (SELECT COUNT(*) FROM categories WHERE is_active = TRUE) AS categories`);
  return row;
}

async function getCoursesByCategory() {
  const [rows] = await pool.query(`
    SELECT ca.name AS category, COUNT(co.id) AS courses
    FROM categories ca
    LEFT JOIN courses co ON co.category_id = ca.id AND co.is_active = TRUE AND co.status = 'published'
    WHERE ca.is_active = TRUE
    GROUP BY ca.id, ca.name
    ORDER BY courses DESC`);
  return rows;
}

async function getTopCourses(limit = 5) {
  const [rows] = await pool.query(
    `SELECT co.id, co.title, COUNT(e.id) AS students
     FROM courses co
     JOIN enrollments e ON e.course_id = co.id AND e.status = 'active'
     WHERE co.is_active = TRUE
     GROUP BY co.id, co.title
     ORDER BY students DESC, co.title
     LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = { getTotals, getCoursesByCategory, getTopCourses };
