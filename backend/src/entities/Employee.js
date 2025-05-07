const { EntitySchema } = require("typeorm");

const Role = {
    HR: "hr",
    DIRECTOR: "director",
    MANAGER: "manager",
    DEVELOPER: "developer",
    INTERN: "intern"
};

const Employee = new EntitySchema({
    name: "Employee",
    columns: {
        id: {
            primary: true,
            type: "varchar"
        },
        name: {
            type: "varchar"
        },

        password: {
            type: "varchar",
            nullable: true
        },
        role: {
            type: "enum",
            enum: Object.values(Role)
        },
       
        sickLeaveBalance: {
            type: "int",
            default: 12
        },
        casualLeaveBalance: {
            type: "int",
            default: 12
        },
        lopCount: {
            type: "int",
            default: 0
        },
        reportingManagerId: {
            type: "varchar",
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
        reportingManager: {
            type: "many-to-one",
            target: "Employee",
            joinColumn: {
                name: "reportingManagerId"
            }
        },
        leaves: {
            type: "one-to-many",
            target: "Leave",
            inverseSide: "employee"
        }
    }
});

module.exports = { Employee, Role }; 