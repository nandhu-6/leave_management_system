const {AppDataSource} = require("../config/database");
const { Employee, Role } = require("../entities/Employee");

const initializeDatabase = async () => {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log("Database connection initialized");

        // await AppDataSource.synchronize(true); 
        // console.log("Database schema synchronized");

        // Create employees
        const employees = [
            {
                id: "LMT101",
                name: "Rinku",
                role: Role.HR,
                reportingManagerId: null
            },
            {
                id: "LMT102",
                name: "Srikanth",
                role: Role.DIRECTOR,
                reportingManagerId: "LMT101"
            },
            {
                id: "LMT103",
                name: "Venkatraman",
                role: Role.MANAGER,
                reportingManagerId: "LMT102"
            },
            {
                id: "LMT104",
                name: "Murugan",
                role: Role.MANAGER,
                reportingManagerId: "LMT102"
            },
            {
                id: "LMT105",
                name: "Nandhini",
                role: Role.INTERN,
                reportingManagerId: "LMT103"
            },
            {
                id: "LMT106",
                name: "Arul",
                role: Role.DEVELOPER,
                reportingManagerId: "LMT104"
            }
        ];

        await AppDataSource.getRepository(Employee).save(employees);
        console.log("Employees created successfully");

        // Close database connection
        await AppDataSource.destroy();
        console.log("Database connection closed");
    } catch (error) {
        console.error("Error initializing database:", error);
    }
};

initializeDatabase();
