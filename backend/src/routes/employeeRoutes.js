const express = require('express');
const router = express.Router();
const {ONLY_HR, MANAGER_DIRECTOR_HR } = require('../constants/constant');
const {getProfile, getReportingManager,getTeam,getManagers, getAllEmployees, createEmployee, updateEmployee, deleteEmployee} = require('../controllers/employeeController');
const {authorize } = require('../middleware/auth');

// Open routes (for all authenticated users)
router.get('/profile', getProfile); //
router.get('/reporting-manager', getReportingManager) //

// Manager, Director, and HR routes
router.get('/team', authorize(MANAGER_DIRECTOR_HR),getTeam); //
router.get('/managers', authorize(ONLY_HR), getManagers);

// HR only routes
router.get('/listEmployees', authorize(ONLY_HR), getAllEmployees); //
router.post('/createEmployee', authorize(ONLY_HR), createEmployee); //
router.put('/updateEmployee/:id', authorize(ONLY_HR), updateEmployee); //
router.delete('/deleteEmployee/:id', authorize(ONLY_HR), deleteEmployee); //

module.exports = router; 