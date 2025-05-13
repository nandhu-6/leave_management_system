const { DataSource } = require("typeorm");
require('dotenv').config();
const {Employee} = require("../entities/Employee");
const {Leave} = require("../entities/Leave");

let AppDataSource;

if (process.env.DATABASE_URL) {
    // Use full DATABASE_URL in production
    AppDataSource = new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false, // required for Render
      },
      logging: false,
      entities: [Employee, Leave],
      migrations: [],
      subscribers: [],
    });
  } else {
    AppDataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        synchronize: true,
        logging: false,
        entities: [Employee, Leave],
        migrations: [],
        subscribers: []
    });
  }


module.exports = { AppDataSource }; 