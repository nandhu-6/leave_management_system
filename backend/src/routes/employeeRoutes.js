const express = require('express');
const router = express.Router();
const {getProfile, getReportingManager,getTeam,getManagers, getAllEmployees, createEmployee, updateEmployee, deleteEmployee} = require('../controllers/employeeController');
const {authorize } = require('../middleware/auth');

// Open routes (for all authenticated users)
router.get('/profile', getProfile); //
router.get('/reporting-manager', getReportingManager) //

// Manager, Director, and HR routes
router.get('/team', authorize(['manager', 'director', 'hr']),getTeam); //
router.get('/managers', authorize(['hr']), getManagers);

// HR only routes
router.get('/listEmployees', authorize(['hr']), getAllEmployees); //
router.post('/createEmployee', authorize(['hr']), createEmployee); //
router.put('/updateEmployee/:id', authorize(['hr']), updateEmployee); //
router.delete('/deleteEmployee/:id', authorize(['hr']), deleteEmployee); //

module.exports = router; 