const {AppDataSource} = require('../config/database');
const { Leave, LeaveType, LeaveStatus } = require('../entities/Leave');
const { Employee, Role } = require('../entities/Employee');
const { LessThanOrEqual, MoreThanOrEqual, In } = require('typeorm');

// Helper function to calculate leave duration
const calculateLeaveDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// Check for overlapping leaves
const checkOverlappingLeaves = async (employeeId, startDate, endDate) => {
    const leaveRepository = AppDataSource.getRepository(Leave);
    const overlappingLeaves = await leaveRepository.find({
        where: {
            employee: { id: employeeId },
            status: In([LeaveStatus.PENDING, LeaveStatus.APPROVED, LeaveStatus.FORWARDED]),
            startDate: LessThanOrEqual(endDate),
            endDate: MoreThanOrEqual(startDate)
        }
    });
    return overlappingLeaves.length > 0;
};

// Helper function to determine next approver
const getNextApprover = async (employee, leaveDuration, currentApprover) => {
    const employeeRepository = AppDataSource.getRepository(Employee);
    
    // If current approver is HR, no next approver needed
    if (currentApprover?.role === Role.HR) {
        return null;
    }
    
    // If current approver is Director, next is HR
    if (currentApprover?.role === Role.DIRECTOR) {
        const hr = await employeeRepository.findOne({ where: { role: Role.HR } });
        return hr;
    }
    
    // If current approver is Manager
    if (currentApprover?.role === Role.MANAGER) {
        // For leaves > 3 days, next is Director
        if (leaveDuration > 3) {
            const director = await employeeRepository.findOne({ where: { role: Role.DIRECTOR } });
            return director;
        }
        // For leaves ≤ 3 days, next is HR
        const hr = await employeeRepository.findOne({ where: { role: Role.HR } });
        return hr;
    }
    
    // For regular employees, first approver is their reporting manager
    if (!currentApprover) {
        const reportingManager = await employeeRepository.findOne({ 
            where: { id: employee.reportingManagerId }
        });
        
        if (!reportingManager) {
            throw new Error('Reporting manager not found');
        }
        
        return reportingManager;
    }
    
    return null;
};

// Apply for leave
const applyLeave = async (req, res) => {
    const { startDate, endDate, reason, type } = req.body;

    try {
        const hasOverlappingLeaves = await checkOverlappingLeaves(req.user.id, startDate, endDate);
        if (hasOverlappingLeaves) {
            return res.status(400).json({ message: "You have already applied for a leave during this period. Please select another date." });
        }

        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({ where: { id: req.user.id } });

        const leaveDuration = calculateLeaveDuration(startDate, endDate);

        // Checking leave balance
        if (type === LeaveType.CASUAL && employee.casualLeaveBalance < leaveDuration) {
            return res.status(400).json({ message: "Insufficient casual leave balance" });
        }
        if (type === LeaveType.SICK && employee.sickLeaveBalance < leaveDuration) {
            return res.status(400).json({ message: "Insufficient sick leave balance" });
        }

        let status = LeaveStatus.PENDING;
        let currentApprover = null;
        let approvalChain = [];

        

        if (type === LeaveType.SICK) {
            status = LeaveStatus.APPROVED;
            employee.sickLeaveBalance -= leaveDuration;
        }
        else if (type === LeaveType.CASUAL) {
            employee.casualLeaveBalance -= leaveDuration;
        }
        else if (type === LeaveType.LOP) {
            employee.lopCount += leaveDuration;
        }
        await employeeRepo.save(employee);

        //if role is hr auto approve all type of leaves(casual/sick/lop) leaves
        if (employee.role === Role.HR) {
            status = LeaveStatus.APPROVED;
            // employee.casualLeaveBalance -= leaveDuration;
            // employee.sickLeaveBalance -= leaveDuration;
            // employee.lopCount += leaveDuration;
            await employeeRepo.save(employee);
        }

         else {
            // Building the complete approval chain upfront
            const seenApprovers = new Set();
            let approver = await getNextApprover(employee, leaveDuration, null);
            
            while (approver && !seenApprovers.has(approver.id)) {
                approvalChain.push({
                    approverId: approver.id,
                    role: approver.role,
                    status: LeaveStatus.PENDING,
                    timestamp: new Date()
                });
                seenApprovers.add(approver.id);
                approver = await getNextApprover(employee, leaveDuration, approver);
            }

            // Set the first approver as current approver
            currentApprover = approvalChain.length > 0 ? approvalChain[0] : null;
        }

        const leaveRepo = AppDataSource.getRepository(Leave);
        const leave = leaveRepo.create({
            employee,
            startDate,
            endDate,
            reason,
            type,
            status,
            leaveDuration,
            currentApproverId: currentApprover?.approverId || null,
            approvalChain: JSON.stringify(approvalChain),
            approvalHistory: JSON.stringify([{
                action: 'APPLIED',
                by: employee.id,
                timestamp: new Date()
            }])
        });

        await leaveRepo.save(leave);
        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Error applying for leave', error: error.message });
    }
};

// Approve leave
const approveLeave = async (req, res) => {
    const { leaveId } = req.params;
    const { comment } = req.body;

    try {
        const leaveRepository = AppDataSource.getRepository(Leave);
        const employeeRepository = AppDataSource.getRepository(Employee);
        
        const leave = await leaveRepository.findOne({
            where: { id: leaveId },
            relations: ['employee', 'currentApprover']
        });

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        const isCurrentApprover = leave.currentApproverId === req.user.id;
        const isForwardedToUser = leave.forwardedTo === req.user.id;

        if (!isCurrentApprover && !isForwardedToUser) {
            return res.status(403).json({ message: 'You are not authorized to approve this leave' });
        }

        // Get current approver's role
        const currentApprover = await employeeRepository.findOne({
            where: { id: req.user.id }
        });

        // Parse current approval chain and history
        const approvalChain = JSON.parse(leave.approvalChain || '[]');
        const approvalHistory = JSON.parse(leave.approvalHistory || '[]');

        // Update current approver's status in chain
        const currentApproverEntry = approvalChain.find(
            entry => entry.approverId === req.user.id && entry.status === LeaveStatus.PENDING
        );
        if (currentApproverEntry) {
            currentApproverEntry.status = LeaveStatus.APPROVED;
            currentApproverEntry.timestamp = new Date();
        }

        // Check if this is the final approval (HR or last in chain)
        const isHR = currentApprover.role === Role.HR;
        const isLastApprover = approvalChain.every(entry => 
            entry.approverId === req.user.id || entry.status === LeaveStatus.APPROVED
        );

        if (isHR || isLastApprover) {
            // Final approval
            leave.status = LeaveStatus.APPROVED;
            leave.currentApproverId = null;
            leave.forwardedTo = null;
            leave.approvedBy = req.user.id;
            
            // // Update employee leave balance
            // const employee = await employeeRepository.findOne({
            //     where: { id: leave.employee.id }
            // });
            
            // if (leave.type === LeaveType.CASUAL) {
            //     employee.casualLeaveBalance -= leave.leaveDuration;
            // }
            // else if(leave.type === LeaveType.LOP) {
            //     employee.lopCount += leave.leaveDuration;
            // } 
            
            // await employeeRepository.save(employee);
            
            // Add to approval history
            approvalHistory.push({
                action: 'APPROVED',
                by: req.user.id,
                comment,
                timestamp: new Date()
            });
        } else {
            // Get next approver
            const nextApprover = await getNextApprover(leave.employee, leave.leaveDuration, currentApprover);
            
            if (nextApprover) {
                // Forward to next approver
                leave.status = LeaveStatus.FORWARDED;
                leave.currentApproverId = nextApprover.id;
                leave.forwardedTo = nextApprover.id;
                
                // Add to approval history
                approvalHistory.push({
                    action: 'FORWARDED',
                    by: req.user.id,
                    comment,
                    timestamp: new Date()
                });
            }
        }

        // Save updates
        leave.approvalChain = JSON.stringify(approvalChain);
        leave.approvalHistory = JSON.stringify(approvalHistory);
        await leaveRepository.save(leave);
        
        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Error approving leave', error: error.message });
    }
};

// Reject leave
const rejectLeave = async (req, res) => {
    const { leaveId } = req.params;
    const { comment } = req.body;

    try {
        const leaveRepository = AppDataSource.getRepository(Leave);
        const employeeRepository = AppDataSource.getRepository(Employee);
        const leave = await leaveRepository.findOne({
            where: { id: leaveId },
            relations: ['employee']
        });

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        const isCurrentApprover = leave.currentApproverId === req.user.id;
        const isForwardedToUser = leave.forwardedTo === req.user.id;

        if (!isCurrentApprover && !isForwardedToUser) {
            return res.status(403).json({ message: 'You are not authorized to approve this leave' });
        }

        leave.status = LeaveStatus.REJECTED;
        leave.currentApproverId = null;

          // add back employee's leave balance

        const employee = await employeeRepository.findOne({
            where: { id: leave.employee.id }
        });
            
        if (leave.type === LeaveType.CASUAL) {
            employee.casualLeaveBalance += leave.leaveDuration;
        }
        else if (Leave.type === LeaveType.SICK) {
            employee.sickLeaveBalance += leave.leaveDuration;
        }
        else if(leave.type === LeaveType.LOP) {
            employee.lopCount -= leave.leaveDuration;
        } 
            
        await employeeRepository.save(employee);
        
        const approvalHistory = JSON.parse(leave.approvalHistory || '[]');
        approvalHistory.push({
            action: 'REJECTED',
            by: req.user.id,
            comment,
            timestamp: new Date()
        });
        leave.approvalHistory = JSON.stringify(approvalHistory);

        await leaveRepository.save(leave);
        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting leave', error: error.message });
    }
};

// Cancel leave
const cancelLeave = async (req, res) => {
    const { leaveId } = req.params;
    const { comment } = req.body;

    try {
        const leaveRepository = AppDataSource.getRepository(Leave);
        const employeeRepository = AppDataSource.getRepository(Employee);

        const leave = await leaveRepository.findOne({
            where: { id: leaveId },
            relations: ['employee']
        });

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.employee.id !== req.user.id) {
            return res.status(403).json({ message: 'You can only cancel your own leaves' });
        }

        if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.FORWARDED && leave.status!== LeaveStatus.APPROVED) {
            return res.status(400).json({ message: 'Only pending or forwarded or approved leaves can be cancelled' });
        }

        // if(leave.status === LeaveStatus.APPROVED) {
        //     //cancel approved leave and increase the type of leave balance
        //     const employeeRepository = AppDataSource.getRepository(Employee);
        //     const employee = await employeeRepository.findOne({
        //         where: { id: leave.employee.id }
        //     });
            
        //     if (leave.type === LeaveType.CASUAL) {
        //         employee.casualLeaveBalance += leave.leaveDuration;
        //     }
        //     if (leave.type === LeaveType.SICK) {
        //         employee.sickLeaveBalance += leave.leaveDuration;
        //     }
        //     else if(leave.type === LeaveType.LOP) {
        //         employee.lopCount -= leave.leaveDuration;
        //     } 
            
        //     await employeeRepository.save(employee);

        // }
        const employee = await employeeRepository.findOne({
            where: { id: leave.employee.id }
        })
        if (leave.type === LeaveType.CASUAL) {
            employee.casualLeaveBalance += leave.leaveDuration;
        }else if (leave.type === LeaveType.SICK) {
            employee.sickLeaveBalance += leave.leaveDuration;
        }else if(leave.type === LeaveType.LOP) {
            employee.lopCount -= leave.leaveDuration;
        }
        await employeeRepository.save(employee);

        leave.status = LeaveStatus.CANCELLED;
        leave.currentApproverId = null;
        
        const approvalHistory = JSON.parse(leave.approvalHistory || '[]');
        approvalHistory.push({
            action: 'CANCELLED',
            by: req.user.id,
            comment,
            timestamp: new Date()
        });
        leave.approvalHistory = JSON.stringify(approvalHistory);

        await leaveRepository.save(leave);
        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling leave', error: error.message });
    }
};

// Get my leaves
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await AppDataSource.getRepository(Leave).find({
            where: { employeeId: req.user.id },
            relations: ['employee', 'currentApprover'],
            order: { createdAt: 'DESC' }
        });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaves', error: error.message });
    }
};

// Get leave balance
const getLeaveBalance = async (req, res) => {
    try {
        const employee = await AppDataSource.getRepository(Employee).findOne({ 
            where: { id: req.user.id }
        });
        res.json({
            casual: employee.casualLeaveBalance,
            sick: employee.sickLeaveBalance,
            lop: employee.lopCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave balance', error: error.message });
    }
};

// Get team leaves (for managers)
const getTeamLeaves = async (req, res) => {
    try {
        const leaves = await AppDataSource.getRepository(Leave).find({
            where: { 
                employee: { reportingManagerId: req.user.id }
            },
            relations: ['employee'],
            order: { createdAt: 'DESC' }
        });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching team leaves', error: error.message });
    }
};

const getPendingApprovals = async (req, res) => {
    try {
        const userId = req.user.id;

        const leaves = await AppDataSource.getRepository(Leave)
            .createQueryBuilder('leave')
            .leftJoinAndSelect('leave.employee', 'employee')
            .where(
                '(leave.forwardedTo = :userId AND leave.status IN (:...statuses)) OR ' +
                '(leave.forwardedTo IS NULL AND leave.currentApproverId = :userId AND leave.status IN (:...statuses))',
                {
                    userId,
                    statuses: [LeaveStatus.PENDING, LeaveStatus.FORWARDED]
                }
            )
            .orderBy('leave.createdAt', 'DESC')
            .getMany();

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending approvals', error: error.message });
    }
};


// Get all leaves (for HR and Director)
const getAllLeaves = async (req, res) => {
    try {
        if (req.user.role !== Role.HR && req.user.role !== Role.DIRECTOR) {
            return res.status(403).json({ message: 'Only HR and Director can view all leaves' });
        }

        const leaves = await AppDataSource.getRepository(Leave).find({
            relations: ['employee'],
            order: { createdAt: 'DESC' }
        });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaves', error: error.message });
    }
};

// Get leave status
const getLeaveStatus = async (req, res) => {
    const { leaveId } = req.params;

    try {
        const leave = await AppDataSource.getRepository(Leave).findOne({
            where: { id: leaveId },
            relations: ['employee', 'currentApprover']
        });

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        // Check authorization
        if (leave.employeeId !== req.user.id && 
            leave.currentApproverId !== req.user.id && 
            req.user.role !== Role.HR && 
            req.user.role !== Role.DIRECTOR) {
            return res.status(403).json({ message: 'You are not authorized to view this leave' });
        }

        // Parse JSON strings for client
        leave.approvalChain = JSON.parse(leave.approvalChain || '[]');
        leave.approvalHistory = JSON.parse(leave.approvalHistory || '[]');

        // res.json(leave);
        res.json(leave.status);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave status', error: error.message });
    }
};

module.exports = {
    applyLeave,
    getMyLeaves,
    getLeaveBalance,
    getTeamLeaves,
    getPendingApprovals,
    approveLeave,
    rejectLeave,
    cancelLeave,
    getAllLeaves,
    getLeaveStatus
};
// const {AppDataSource} = require('../config/database');
// const { Leave, LeaveType, LeaveStatus } = require('../entities/Leave');
// const { Employee, Role } = require('../entities/Employee');
// const { LessThanOrEqual, MoreThanOrEqual, In } = require('typeorm');

// // Helper function to calculate leave duration
// const calculateLeaveDuration = (startDate, endDate) => {
//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     const diffTime = Math.abs(end - start);
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
// };

// // Check for overlapping leaves
// const checkOverlappingLeaves = async (employeeId, startDate, endDate) => {
//     const leaveRepository = AppDataSource.getRepository(Leave);
//     const overlappingLeaves = await leaveRepository.find({
//         where: {
//             employee: { id: employeeId },
//             status: In([LeaveStatus.PENDING, LeaveStatus.APPROVED, LeaveStatus.FORWARDED]),
//             startDate: LessThanOrEqual(endDate),
//             endDate: MoreThanOrEqual(startDate)
//         }
//     });
//     return overlappingLeaves.length > 0;
// };

// // Helper function to determine next approver
// const getNextApprover = async (employee, leaveDuration, currentApprover) => {
//     const employeeRepository = AppDataSource.getRepository(Employee);
    
//     // If current approver is HR, no next approver needed
//     if (currentApprover?.role === Role.HR) {
//         return null;
//     }
    
//     // If current approver is Director, next is HR
//     if (currentApprover?.role === Role.DIRECTOR) {
//         const hr = await employeeRepository.findOne({ where: { role: Role.HR } });
//         return hr;
//     }
    
//     // If current approver is Manager
//     if (currentApprover?.role === Role.MANAGER) {
//         // For leaves > 3 days, next is Director
//         if (leaveDuration > 3) {
//             const director = await employeeRepository.findOne({ where: { role: Role.DIRECTOR } });
//             return director;
//         }
//         // For leaves ≤ 3 days, next is HR
//         const hr = await employeeRepository.findOne({ where: { role: Role.HR } });
//         return hr;
//     }
    
//     // For regular employees, first approver is their reporting manager
//     if (!currentApprover) {
//         const reportingManager = await employeeRepository.findOne({ 
//             where: { id: employee.reportingManagerId }
//         });
        
//         if (!reportingManager) {
//             throw new Error('Reporting manager not found');
//         }
        
//         return reportingManager;
//     }
    
//     return null;
// };

// // Apply for leave
// const applyLeave = async (req, res) => {
//     const { startDate, endDate, reason, type } = req.body;

//     try {
//         const hasOverlappingLeaves = await checkOverlappingLeaves(req.user.id, startDate, endDate);
//         if (hasOverlappingLeaves) {
//             return res.status(400).json({ message: "You have already applied for a leave during this period. Please select another date." });
//         }

//         const employeeRepo = AppDataSource.getRepository(Employee);
//         const employee = await employeeRepo.findOne({ where: { id: req.user.id } });

//         const leaveDuration = calculateLeaveDuration(startDate, endDate);

//         // Checking leave balance
//         if (type === LeaveType.CASUAL && employee.casualLeaveBalance < leaveDuration) {
//             return res.status(400).json({ message: "Insufficient casual leave balance" });
//         }
//         if (type === LeaveType.SICK && employee.sickLeaveBalance < leaveDuration) {
//             return res.status(400).json({ message: "Insufficient sick leave balance" });
//         }

//         let status = LeaveStatus.PENDING;
//         let currentApprover = null;
//         let approvalChain = [];

//         if (type === LeaveType.SICK) {
//             status = LeaveStatus.APPROVED;
//             // console.log(leaveDuration);
//             employee.sickLeaveBalance -= leaveDuration;
//             await employeeRepo.save(employee);


//         }
//         //if role is hr auto approve all type of leaves(casual/sick/lop) leaves
//         else if (employee.role === Role.HR) {
//             status = LeaveStatus.APPROVED;
//             employee.casualLeaveBalance -= leaveDuration;
//             employee.sickLeaveBalance -= leaveDuration;
//             employee.lopCount += leaveDuration;
//             await employeeRepo.save(employee);
//         }

//          else {
//             // Building the complete approval chain upfront
//             const seenApprovers = new Set();
//             let approver = await getNextApprover(employee, leaveDuration, null);
            
//             while (approver && !seenApprovers.has(approver.id)) {
//                 approvalChain.push({
//                     approverId: approver.id,
//                     role: approver.role,
//                     status: LeaveStatus.PENDING,
//                     timestamp: new Date()
//                 });
//                 seenApprovers.add(approver.id);
//                 approver = await getNextApprover(employee, leaveDuration, approver);
//             }

//             // Set the first approver as current approver
//             currentApprover = approvalChain.length > 0 ? approvalChain[0] : null;
//         }

//         const leaveRepo = AppDataSource.getRepository(Leave);
//         const leave = leaveRepo.create({
//             employee,
//             startDate,
//             endDate,
//             reason,
//             type,
//             status,
//             leaveDuration,
//             currentApproverId: currentApprover?.approverId || null,
//             approvalChain: JSON.stringify(approvalChain),
//             approvalHistory: JSON.stringify([{
//                 action: 'APPLIED',
//                 by: employee.id,
//                 timestamp: new Date()
//             }])
//         });

//         await leaveRepo.save(leave);
//         res.status(201).json(leave);
//     } catch (error) {
//         res.status(500).json({ message: 'Error applying for leave', error: error.message });
//     }
// };

// // Approve leave
// const approveLeave = async (req, res) => {
//     const { leaveId } = req.params;
//     const { comment } = req.body;

//     try {
//         const leaveRepository = AppDataSource.getRepository(Leave);
//         const employeeRepository = AppDataSource.getRepository(Employee);
        
//         const leave = await leaveRepository.findOne({
//             where: { id: leaveId },
//             relations: ['employee', 'currentApprover']
//         });

//         if (!leave) {
//             return res.status(404).json({ message: 'Leave not found' });
//         }

//         const isCurrentApprover = leave.currentApproverId === req.user.id;
//         const isForwardedToUser = leave.forwardedTo === req.user.id;

//         if (!isCurrentApprover && !isForwardedToUser) {
//             return res.status(403).json({ message: 'You are not authorized to approve this leave' });
//         }

//         // Get current approver's role
//         const currentApprover = await employeeRepository.findOne({
//             where: { id: req.user.id }
//         });

//         // Parse current approval chain and history
//         const approvalChain = JSON.parse(leave.approvalChain || '[]');
//         const approvalHistory = JSON.parse(leave.approvalHistory || '[]');

//         // Update current approver's status in chain
//         const currentApproverEntry = approvalChain.find(
//             entry => entry.approverId === req.user.id && entry.status === LeaveStatus.PENDING
//         );
//         if (currentApproverEntry) {
//             currentApproverEntry.status = LeaveStatus.APPROVED;
//             currentApproverEntry.timestamp = new Date();
//         }

//         // Check if this is the final approval (HR or last in chain)
//         const isHR = currentApprover.role === Role.HR;
//         const isLastApprover = approvalChain.every(entry => 
//             entry.approverId === req.user.id || entry.status === LeaveStatus.APPROVED
//         );

//         if (isHR || isLastApprover) {
//             // Final approval
//             leave.status = LeaveStatus.APPROVED;
//             leave.currentApproverId = null;
//             leave.forwardedTo = null;
//             leave.approvedBy = req.user.id;
            
//             // Update employee leave balance
//             const employee = await employeeRepository.findOne({
//                 where: { id: leave.employee.id }
//             });
            
//             if (leave.type === LeaveType.CASUAL) {
//                 employee.casualLeaveBalance -= leave.leaveDuration;
//             }
//             else if(leave.type === LeaveType.LOP) {
//                 employee.lopCount += leave.leaveDuration;
//             } 
            
//             await employeeRepository.save(employee);
            
//             // Add to approval history
//             approvalHistory.push({
//                 action: 'APPROVED',
//                 by: req.user.id,
//                 comment,
//                 timestamp: new Date()
//             });
//         } else {
//             // Get next approver
//             const nextApprover = await getNextApprover(leave.employee, leave.leaveDuration, currentApprover);
            
//             if (nextApprover) {
//                 // Forward to next approver
//                 leave.status = LeaveStatus.FORWARDED;
//                 leave.currentApproverId = nextApprover.id;
//                 leave.forwardedTo = nextApprover.id;
                
//                 // Add to approval history
//                 approvalHistory.push({
//                     action: 'FORWARDED',
//                     by: req.user.id,
//                     comment,
//                     timestamp: new Date()
//                 });
//             }
//         }

//         // Save updates
//         leave.approvalChain = JSON.stringify(approvalChain);
//         leave.approvalHistory = JSON.stringify(approvalHistory);
//         await leaveRepository.save(leave);
        
//         res.json(leave);
//     } catch (error) {
//         res.status(500).json({ message: 'Error approving leave', error: error.message });
//     }
// };

// // Reject leave
// const rejectLeave = async (req, res) => {
//     const { leaveId } = req.params;
//     const { comment } = req.body;

//     try {
//         const leaveRepository = AppDataSource.getRepository(Leave);
//         const leave = await leaveRepository.findOne({
//             where: { id: leaveId },
//             relations: ['employee']
//         });

//         if (!leave) {
//             return res.status(404).json({ message: 'Leave not found' });
//         }

//         const isCurrentApprover = leave.currentApproverId === req.user.id;
//         const isForwardedToUser = leave.forwardedTo === req.user.id;

//         if (!isCurrentApprover && !isForwardedToUser) {
//             return res.status(403).json({ message: 'You are not authorized to approve this leave' });
//         }

//         leave.status = LeaveStatus.REJECTED;
//         leave.currentApproverId = null;
        
//         const approvalHistory = JSON.parse(leave.approvalHistory || '[]');
//         approvalHistory.push({
//             action: 'REJECTED',
//             by: req.user.id,
//             comment,
//             timestamp: new Date()
//         });
//         leave.approvalHistory = JSON.stringify(approvalHistory);

//         await leaveRepository.save(leave);
//         res.json(leave);
//     } catch (error) {
//         res.status(500).json({ message: 'Error rejecting leave', error: error.message });
//     }
// };

// // Cancel leave
// const cancelLeave = async (req, res) => {
//     const { leaveId } = req.params;
//     const { comment } = req.body;

//     try {
//         const leaveRepository = AppDataSource.getRepository(Leave);
//         const leave = await leaveRepository.findOne({
//             where: { id: leaveId },
//             relations: ['employee']
//         });

//         if (!leave) {
//             return res.status(404).json({ message: 'Leave not found' });
//         }

//         if (leave.employee.id !== req.user.id) {
//             return res.status(403).json({ message: 'You can only cancel your own leaves' });
//         }

//         if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.FORWARDED && leave.status!== LeaveStatus.APPROVED) {
//             return res.status(400).json({ message: 'Only pending or forwarded or approved leaves can be cancelled' });
//         }

//         if(leave.status === LeaveStatus.APPROVED) {
//             //cancel approved leave and increase the type of leave balance
//             const employeeRepository = AppDataSource.getRepository(Employee);
//             const employee = await employeeRepository.findOne({
//                 where: { id: leave.employee.id }
//             });
            
//             if (leave.type === LeaveType.CASUAL) {
//                 employee.casualLeaveBalance += leave.leaveDuration;
//             }
//             if (leave.type === LeaveType.SICK) {
//                 employee.sickLeaveBalance += leave.leaveDuration;
//             }
//             else if(leave.type === LeaveType.LOP) {
//                 employee.lopCount -= leave.leaveDuration;
//             } 
            
//             await employeeRepository.save(employee);

//         }

//         leave.status = LeaveStatus.CANCELLED;
//         leave.currentApproverId = null;
        
//         const approvalHistory = JSON.parse(leave.approvalHistory || '[]');
//         approvalHistory.push({
//             action: 'CANCELLED',
//             by: req.user.id,
//             comment,
//             timestamp: new Date()
//         });
//         leave.approvalHistory = JSON.stringify(approvalHistory);

//         await leaveRepository.save(leave);
//         res.json(leave);
//     } catch (error) {
//         res.status(500).json({ message: 'Error cancelling leave', error: error.message });
//     }
// };

// // Get my leaves
// const getMyLeaves = async (req, res) => {
//     try {
//         const leaves = await AppDataSource.getRepository(Leave).find({
//             where: { employeeId: req.user.id },
//             relations: ['employee', 'currentApprover'],
//             order: { createdAt: 'DESC' }
//         });
//         res.json(leaves);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching leaves', error: error.message });
//     }
// };

// // Get leave balance
// const getLeaveBalance = async (req, res) => {
//     try {
//         const employee = await AppDataSource.getRepository(Employee).findOne({ 
//             where: { id: req.user.id }
//         });
//         res.json({
//             casual: employee.casualLeaveBalance,
//             sick: employee.sickLeaveBalance,
//             lop: employee.lopCount
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching leave balance', error: error.message });
//     }
// };

// // Get team leaves (for managers)
// const getTeamLeaves = async (req, res) => {
//     try {
//         const leaves = await AppDataSource.getRepository(Leave).find({
//             where: { 
//                 employee: { reportingManagerId: req.user.id }
//             },
//             relations: ['employee'],
//             order: { createdAt: 'DESC' }
//         });
//         res.json(leaves);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching team leaves', error: error.message });
//     }
// };

// const getPendingApprovals = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         const leaves = await AppDataSource.getRepository(Leave)
//             .createQueryBuilder('leave')
//             .leftJoinAndSelect('leave.employee', 'employee')
//             .where(
//                 '(leave.forwardedTo = :userId AND leave.status IN (:...statuses)) OR ' +
//                 '(leave.forwardedTo IS NULL AND leave.currentApproverId = :userId AND leave.status IN (:...statuses))',
//                 {
//                     userId,
//                     statuses: [LeaveStatus.PENDING, LeaveStatus.FORWARDED]
//                 }
//             )
//             .orderBy('leave.createdAt', 'DESC')
//             .getMany();

//         res.json(leaves);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching pending approvals', error: error.message });
//     }
// };


// // Get all leaves (for HR and Director)
// const getAllLeaves = async (req, res) => {
//     try {
//         if (req.user.role !== Role.HR && req.user.role !== Role.DIRECTOR) {
//             return res.status(403).json({ message: 'Only HR and Director can view all leaves' });
//         }

//         const leaves = await AppDataSource.getRepository(Leave).find({
//             relations: ['employee'],
//             order: { createdAt: 'DESC' }
//         });
//         res.json(leaves);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching leaves', error: error.message });
//     }
// };

// // Get leave status
// const getLeaveStatus = async (req, res) => {
//     const { leaveId } = req.params;

//     try {
//         const leave = await AppDataSource.getRepository(Leave).findOne({
//             where: { id: leaveId },
//             relations: ['employee', 'currentApprover']
//         });

//         if (!leave) {
//             return res.status(404).json({ message: 'Leave not found' });
//         }

//         // Check authorization
//         if (leave.employeeId !== req.user.id && 
//             leave.currentApproverId !== req.user.id && 
//             req.user.role !== Role.HR && 
//             req.user.role !== Role.DIRECTOR) {
//             return res.status(403).json({ message: 'You are not authorized to view this leave' });
//         }

//         // Parse JSON strings for client
//         leave.approvalChain = JSON.parse(leave.approvalChain || '[]');
//         leave.approvalHistory = JSON.parse(leave.approvalHistory || '[]');

//         // res.json(leave);
//         res.json(leave.status);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching leave status', error: error.message });
//     }
// };

// module.exports = {
//     applyLeave,
//     getMyLeaves,
//     getLeaveBalance,
//     getTeamLeaves,
//     getPendingApprovals,
//     approveLeave,
//     rejectLeave,
//     cancelLeave,
//     getAllLeaves,
//     getLeaveStatus
// };