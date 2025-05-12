import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllEmployees, getManagers, addEmployee, deleteEmployee, updateEmployee } from '../services/employeeService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EmployeeModal from '../components/EmployeeModal';
const EmployeeManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    reportingManagerId: ''
  });
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await getAllEmployees();
      setEmployees(data);
      console.log("employees", employees);
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const data = await getManagers();
      setManagers(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch managers');
    }
  };
  // console.log("managers", managers);
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    console.log("form data", formData);

    try {
      await addEmployee(formData);
      setShowAddModal(false);
      setFormData({
        id: '',
        name: '',
        role: '',
        reportingManagerId: ''
      });
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();

    try {
      await updateEmployee(selectedEmployee.id, formData);
      setShowEditModal(false);
      setSelectedEmployee(null);
      setFormData({
        id: '',
        name: '',
        role: '',
        reportingManagerId: ''
      });
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to edit employee');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await deleteEmployee(employeeId);;
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      reportingManagerId: employee.managerId || ''
    });
    setShowEditModal(true);
  };
  const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100">
      <div className="max-w-7xl mx-auto ">
        <div>
          <div className="flex justify-end items-center mb-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary">
              Add Employee
            </button>
          </div>

          {/* Employee List */}
          <div className="bg-white shadow max-h-[70vh] overflow-auto sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {capitalizeFirstLetter(employee.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.reportingManager?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <EmployeeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({
            id: '',
            name: '',
            role: '',
            reportingManagerId: ''
          });
        }}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleAddEmployee}
        managers={managers}
        isEdit={false}
      />

      {/* Edit Employee Modal */}
      <EmployeeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
          setFormData({
            id: '',
            name: '',
            role: '',
            reportingManagerId: ''
          });
        }}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleEditEmployee}
        managers={managers}
        isEdit={true}
      />
    </div>
  );
};

export default EmployeeManagement;
