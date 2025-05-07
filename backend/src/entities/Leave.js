const { EntitySchema } = require("typeorm");

const LeaveType = {
    SICK: "sick",
    CASUAL: "casual",
    LOP: "lop"
};

const LeaveStatus = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    FORWARDED: "forwarded",
    CANCELLED: "cancelled"
};

const Leave = new EntitySchema({
    name: "Leave",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        employeeId: {
            type: "varchar"
        },
        type: {
            type: "enum",
            enum: Object.values(LeaveType)
        },
        status: {
            type: "enum",
            enum: Object.values(LeaveStatus),
            default: LeaveStatus.PENDING
        },
        startDate: {
            type: "date"
        },
        endDate: {
            type: "date"
        },
        leaveDuration: {
            type: "int"
        },
        reason: {
            type: "varchar"
        },
        currentApproverId: {
            type: "varchar",
            nullable: true
        },
        approvedBy: {
            type: "varchar",
            nullable: true
        },
        forwardedTo: {
            type: "varchar",
            nullable: true
        },
        approvalChain: {
            type: "simple-array",
            nullable: true
        },
        approvalHistory: {
            type: "json",
            nullable: true
        },
        createdAt: {
            type: "timestamp",
            createDate: true
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true
        }
    },
    relations: {
        employee: {
            type: "many-to-one",
            target: "Employee",
            joinColumn: {
                name: "employeeId"
            }
        },
        currentApprover: {
            type: "many-to-one",
            target: "Employee",
            joinColumn: {
                name: "currentApproverId"
            }
        },
        approvedByEmployee: {
            type: "many-to-one",
            target: "Employee",
            joinColumn: {
                name: "approvedBy"
            }
        },
        forwardedToEmployee: {
            type: "many-to-one",
            target: "Employee",
            joinColumn: {
                name: "forwardedTo"
            }
        }
    }
});

module.exports = { Leave, LeaveType, LeaveStatus }; 