const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { AppDataSource } = require('../config/database');
const { Employee } = require('../entities/Employee');
const JWT_SECRET = process.env.JWT_SECRET;
const logger = require('../../utils/logger');

// Register new employee
const register = async (req, res) => {
    try {
        const { id, password } = req.body;

        //find employee
        const employee = await AppDataSource.getRepository(Employee).findOne({
            where: { id }
        });

        if (!employee) {
            logger.error(`Employee with id ${id} already exists`);
            return res.status(404).json({ message: 'Employee record not found, Contact HR' });
        }

        if (employee.password) {
            logger.warn(`Employee with id ${id} already registered`);
            return res.status(400).json({ message: 'Employee already registered, Please Login' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        employee.password = hashedPassword;

        await AppDataSource.getRepository(Employee).save(employee);
        logger.info(`Employee with id ${id} registered successfully`);
        res.status(200).json({ message: 'Employee registered successfully' });
    } catch (error) {
        logger.error(`Error registering employee: ${error.message}`);
        res.status(500).json({ message: 'Error registering employee', error: error.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { id, password } = req.body;


        // Find employee
        const employee = await AppDataSource.getRepository(Employee).findOne({
            where: { id }
        });


        if (!employee) {
            logger.error(`Employee with id ${id} not found`);
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (employee.password == null || employee.password == '') {
            logger.error(`Employee with id ${id} has no password set`);
            return res.status(403).json({ message: 'Please Register and set password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            logger.error(`Invalid password for employee with id ${id}`);
            return res.status(401).json({ message: 'Invalid password' });
        }



        // Generate JWT token
        const token = jwt.sign(
            { id: employee.id, role: employee.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            employee: {
                id: employee.id,
                name: employee.name,
                role: employee.role
            }
        });
        logger.info(`Employee with id ${id} logged in successfully`);
    } catch (error) {
        logger.error(`Error logging in employee: ${error.message}`);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

module.exports = {
    register,
    login
}; 