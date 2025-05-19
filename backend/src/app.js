const express = require('express');
const cors = require('cors');
const { AppDataSource } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const {authenticate} = require('./middleware/auth');
const logger = require('../utils/logger')

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/employees',authenticate, employeeRoutes);
app.use('/leaves',authenticate, leaveRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
    logger.error("Internal server error", err);

});
// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        logger.info("Database connection established");
    })
    .catch((error) => {
        logger.error("Error connecting to database", error);
    });

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    // console.log(`Server is running on port ${PORT}`);
    logger.info("Server started on port", PORT);
}); 

