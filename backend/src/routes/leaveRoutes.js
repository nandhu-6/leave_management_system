const express = require('express');
const router = express.Router();
const {applyLeave, getMyLeaves, getLeaveBalance,cancelLeave, getLeaveStatus, getTeamLeaves, getPendingApprovals, approveLeave,rejectLeave, getAllLeaves} = require('../controllers/leaveController');
const {authorize } = require('../middleware/auth');

// Open routes (for all authenticated users)
router.post('/apply', applyLeave); //
router.get('/my-leaves', getMyLeaves); //
router.get('/balance',  getLeaveBalance); //
router.post('/:leaveId/cancel', cancelLeave); //
router.get('/status/:leaveId', getLeaveStatus) //

// Manager, Director, and HR routes
router.get('/team-leaves', authorize(['manager', 'director', 'hr']),getTeamLeaves); //
router.get('/pending-approvals', authorize(['manager', 'director', 'hr']), getPendingApprovals); //
router.post('/:leaveId/approve', authorize(['manager', 'director', 'hr']), approveLeave); //
router.post('/:leaveId/reject', authorize(['manager', 'director', 'hr']), rejectLeave); //


// HR only routes
router.get('/all', authorize(['hr']), getAllLeaves); //
// router.get('/status/:id', authorize(['hr']),getLeaveStatus);

module.exports = router; 