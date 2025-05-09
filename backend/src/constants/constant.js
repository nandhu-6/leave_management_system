const { Role } = require('../entities/Employee');

const ONLY_HR = [Role.HR];
const MANAGER_DIRECTOR_HR = [Role.MANAGER, Role.DIRECTOR, Role.HR];

module.exports = { ONLY_HR, MANAGER_DIRECTOR_HR };