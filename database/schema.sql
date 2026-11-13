-- =============================================================
-- TechLearn - Esquema de base de datos (MySQL 8+)
-- Normalizado en 3NF. Bajas lógicas mediante is_active / status.
-- ¡ATENCIÓN! Borra y recrea todas las tablas.
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS instructors;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- Tipos de usuario (catálogo fijo)
CREATE TABLE roles (
  id   TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(20)      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cuentas de acceso
CREATE TABLE users (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)     NOT NULL,
  email         VARCHAR(150)     NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  role_id       TINYINT UNSIGNED NOT NULL,
  is_active     BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME         NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Perfil público del instructor (relación 1:1 con users)
CREATE TABLE instructors (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  bio        TEXT         NULL,
  photo_url  VARCHAR(255) NULL,
  specialty  VARCHAR(100) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_instructors_user (user_id),
  CONSTRAINT fk_instructors_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorías de cursos (administradas por el admin)
CREATE TABLE categories (
  id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(60)       NOT NULL,
  slug        VARCHAR(60)       NOT NULL,
  description VARCHAR(255)      NULL,
  image_url   VARCHAR(255)      NULL,
  is_active   BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME          NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cursos
CREATE TABLE courses (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  title         VARCHAR(150)      NOT NULL,
  description   TEXT              NOT NULL,
  price         DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  level         ENUM('beginner','intermediate','advanced') NOT NULL,
  image_url     VARCHAR(255)      NULL,
  category_id   SMALLINT UNSIGNED NOT NULL,
  instructor_id INT UNSIGNED      NOT NULL,
  status        ENUM('draft','published','hidden') NOT NULL DEFAULT 'draft',
  is_active     BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_courses_catalog (status, is_active, category_id),
  KEY idx_courses_instructor (instructor_id),
  CONSTRAINT fk_courses_category   FOREIGN KEY (category_id)   REFERENCES categories (id),
  CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id) REFERENCES instructors (id),
  CONSTRAINT chk_courses_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inscripciones (un usuario solo puede tener una inscripción por curso)
CREATE TABLE enrollments (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  status      ENUM('active','cancelled') NOT NULL DEFAULT 'active',
  enrolled_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollments_user_course (user_id, course_id),
  KEY idx_enrollments_course (course_id),
  CONSTRAINT fk_enrollments_user   FOREIGN KEY (user_id)   REFERENCES users (id),
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

----- Información inicial necesaria -----
-- Roles fijos del sistema (necesarios para registrar usuarios)
INSERT INTO roles (name) VALUES ('admin'), ('instructor'), ('user');

-- Categorías fijas del sistema
INSERT INTO categories (name, slug, description) VALUES
('Frontend', 'frontend', 'Interfaces web modernas'),
('Backend', 'backend', 'APIs y servidores');

----- Asignar rol admin a usuario -----
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE email = 'manuelsmc2004@gmail.com';