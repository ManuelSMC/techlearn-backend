const statsRepository = require('../repositories/stats.repository');

async function getDashboard() {
  const [totals, coursesByCategory, topCourses] = await Promise.all([
    statsRepository.getTotals(),
    statsRepository.getCoursesByCategory(),
    statsRepository.getTopCourses(5),
  ]);
  return { totals, coursesByCategory, topCourses };
}

module.exports = { getDashboard };
