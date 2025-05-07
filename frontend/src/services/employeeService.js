import axios from 'axios';

const API_URL = 'http://localhost:7000/employees';

export const getAllEmployees = async () => {
  const response = await axios.get(`${API_URL}/listEmployees`);
  return response.data;
};

export const getManagers = async () => {
  const response = await axios.get(`${API_URL}/managers`);
  return response.data;
};

export const addEmployee = async (employeeData) => {
  const response = await axios.post(`${API_URL}/createEmployee`, employeeData);
  return response.data;
};

export const updateEmployee = async (id, employeeData) => {
  const response = await axios.put(`${API_URL}/updateEmployee/${id}`, employeeData);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await axios.delete(`${API_URL}/deleteEmployee//${id}`);
  return response.data;
};
