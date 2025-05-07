const { DataSource } = require("typeorm");
require('dotenv').config();
const {Employee} = require("../entities/Employee");
const {Leave} = require("../entities/Leave");


const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "localhost",
    password: "Root@123",
    database: "leave_management_system",
    synchronize: true,
    logging: false,
    entities: [Employee, Leave],
    migrations: [],
    subscribers: []
});

module.exports = { AppDataSource }; 