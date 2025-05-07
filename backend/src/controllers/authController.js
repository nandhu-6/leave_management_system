const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {AppDataSource} = require('../config/database');
const { Employee } = require('../entities/Employee');
const JWT_SECRET = 'nandhuS_superStrong_secretKey';

// Register new employee
const register = async (req, res) => {
    try {
        const { id, password} = req.body;

        //find employee
        const employee = await AppDataSource.getRepository(Employee).findOne({
            where: { id }
        });

        if(!employee){
            return res.status(404).json({ message: 'Employee record not found, Contact HR' });
        }

        if(employee.password){
            return res.status(400).json({ message: 'Employee already registered, Please Login' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        employee.password = hashedPassword;

        await AppDataSource.getRepository(Employee).save(employee);
        res.status(200).json({ message: 'Employee registered successfully' });
    } catch (error) {
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
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: employee.id,  role: employee.role },
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
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

module.exports = {
    register,
    login
}; 