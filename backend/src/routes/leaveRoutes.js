const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, getLeaveBalance, cancelLeave, getLeaveStatus, getTeamLeaves, getPendingApprovals, approveLeave, rejectLeave, getAllLeaves, getHolidays, getTeamCalendar } = require('../controllers/leaveController');
const { ONLY_HR, MANAGER_DIRECTOR_HR } = require('../constants/constant');
const { authorize } = require('../middleware/auth');

// Open routes (for all authenticated users)
router.post('/apply', applyLeave); //
router.get('/my-leaves', getMyLeaves); //
router.get('/balance', getLeaveBalance); //
router.post('/:leaveId/cancel', cancelLeave); //
router.get('/status/:leaveId', getLeaveStatus) //
router.get('/holidays', getHolidays); //

// Manager, Director, and HR routes
router.get('/team-leaves', authorize(MANAGER_DIRECTOR_HR), getTeamLeaves); //
router.get('/pending-approvals', authorize(MANAGER_DIRECTOR_HR), getPendingApprovals); //
router.post('/:leaveId/approve', authorize(MANAGER_DIRECTOR_HR), approveLeave); //
router.post('/:leaveId/reject', authorize(MANAGER_DIRECTOR_HR), rejectLeave); //

router.get('/team-calendar', getTeamCalendar);
// HR only routes
router.get('/all', getAllLeaves); //

module.exports = router; 