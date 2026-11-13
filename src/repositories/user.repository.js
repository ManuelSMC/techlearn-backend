const pool = require('../config/db');

// Nunca se selecciona password_hash salvo en findByEmailWithPassword (solo para el login).
const BASE_SELECT = `
  SELECT u.id, u.name, u.email, r.name AS role, u.is_active AS isActive,
         u.created_at AS createdAt, i.id AS instructorId
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN instructors i ON i.user_id = u.id`;

function mapUser(row) {
  if (!row) return null;
  return { ...row, isActive: Boolean(row.isActive) };
}

async function findById(id, db = pool) {
  const [rows] = await db.query(`${BASE_SELECT} WHERE u.id = ?`, [id]);
  return mapUser(rows[0]);
}

async function findByEmailWithPassword(email) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash AS passwordHash, r.name AS role, u.is_active AS isActive
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email]
  );
  return mapUser(rows[0]);
}

async function create({ name, email, passwordHash, role }, db = pool) {
  const [result] = await db.query(
    `INSERT INTO users (name, email, password_hash, role_id)
     VALUES (?, ?, ?, (SELECT id FROM roles WHERE name = ?))`,
    [name, email, passwordHash, role]
  );
  return result.insertId;
}

async function list({ role, search, page, limit }) {
  const conditions = [];
  const params = [];
  if (role) {
    conditions.push('r.name = ?');
    params.push(role);
  }
  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(`${BASE_SELECT} ${where} ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?`, [
    ...params,
    limit,
    (page - 1) * limit,
  ]);
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users u JOIN roles r ON r.id = u.role_id ${where}`,
    params
  );
  return { items: rows.map(mapUser), total };
}

async function setActive(id, isActive) {
  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
}

module.exports = { findById, findByEmailWithPassword, create, list, setActive };
