const ROLES = Object.freeze({
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  USER: 'user',
});

const COURSE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
});

const COURSE_LEVELS = Object.freeze(['beginner', 'intermediate', 'advanced']);

const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
});

module.exports = { ROLES, COURSE_STATUS, COURSE_LEVELS, ENROLLMENT_STATUS };
