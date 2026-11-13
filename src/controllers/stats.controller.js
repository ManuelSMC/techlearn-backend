const statsService = require('../services/stats.service');
const { sendSuccess } = require('../utils/response');

async function getDashboard(req, res) {
  sendSuccess(res, { data: await statsService.getDashboard() });
}

module.exports = { getDashboard };
