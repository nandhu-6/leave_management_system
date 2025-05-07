// import { In } from 'typeorm'; 
const {In} = require('typeorm');

const {AppDataSource} = require('../config/database');
const { Employee } = require('../entities/Employee');


// Get all employees
const getAllEmployees = async (req, res) => {
    try {
        const employeeRepository = AppDataSource.getRepository(Employee);
        const employees = await employeeRepository.find({
            relations: ['reportingManager']
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
};

// Create new employee
const createEmployee = async (req, res) => {
    try {
        const {
            name,
            id,
            role,
            reportingManagerId,
            sickLeaveBalance,
            casualLeaveBalance
        } = req.body;

        const employeeRepository = AppDataSource.getRepository(Employee);
        const employee = employeeRepository.create({
            name,
            id,
            role,
            reportingManagerId,
            sickLeaveBalance: sickLeaveBalance || 12, // Default 12 days
            casualLeaveBalance: casualLeaveBalance || 12, // Default 12 days
            lopCount: 0
        });

        const savedEmployee = await employeeRepository.save(employee);
        res.status(201).json(savedEmployee);
    } catch (error) {
        res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
};

// Update employee details
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            role,
            reportingManagerId,
            sickLeaveBalance,
            casualLeaveBalance,
            lopCount
        } = req.body;

        const employeeRepository = AppDataSource.getRepository(Employee);
        const employee = await employeeRepository.findOne({ where: { id } });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Update only provided fields
        if (name) employee.name = name;
        if (role) employee.role = role;
        if (reportingManagerId) employee.reportingManagerId = reportingManagerId;
        if (sickLeaveBalance !== undefined) employee.sickLeaveBalance = sickLeaveBalance;
        if (casualLeaveBalance !== undefined) employee.casualLeaveBalance = casualLeaveBalance;
        if (lopCount !== undefined) employee.lopCount = lopCount;

        const updatedEmployee = await employeeRepository.save(employee);
        res.json(updatedEmployee);
    } catch (error) {
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
};

// Get employee profile
const getProfile = async (req, res) => {
    // console.log(req.user);
    try {

        const employee = await AppDataSource.getRepository(Employee).findOne({
            where: { id: req.user.id },
            relations: ['reportingManager']
        });
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};



// Get reporting manager
const getReportingManager = async (req, res) => {
    try {
        // console.log("ipo",req);
        
    const id = req.user.id;
        // console.log("ipo id",id );

        const employeeRepository = AppDataSource.getRepository(Employee);
        const employee = await employeeRepository.findOne({ 
            where: { id },
            relations: ['reportingManager']
        });
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        res.json(employee.reportingManagerId);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reporting manager', error: error.message });
    }
};



// Get team members
const getTeam = async (req, res) => {
    try {
        const employees = await AppDataSource.getRepository(Employee).find({
            where: { reportingManager: { id: req.user.id } }
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching team members', error: error.message });
    }
};

// Get managers
const getManagers = async (req, res) => {
    try {
        const managers = await AppDataSource.getRepository(Employee).find({
            where: { role: In(['manager', 'director', 'hr']) }
        });
        console.log(managers);
        
        res.json(managers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching managers', error: error.message });
    }
};

// Delete employee (HR only)
const deleteEmployee = async (req, res) => {
    try {
        const employee = await AppDataSource.getRepository(Employee).findOne({
            where: { id: req.params.id }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await AppDataSource.getRepository(Employee).remove(employee);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
};

module.exports = {
    getAllEmployees,
    createEmployee,
    updateEmployee,
    getProfile,
    getReportingManager,
    getTeam,
    getManagers,
    deleteEmployee
}; 