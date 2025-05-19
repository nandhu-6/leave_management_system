import axios from 'axios';
const API_URL = `${process.env.REACT_APP_BASE_URL}/employees`;

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
  const response = await axios.delete(`${API_URL}/deleteEmployee/${id}`);
  return response.data;
};

export const getProfile = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  const response = await axios.get(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}


export const getTeam = async() => {
  const response = await axios.get(`${API_URL}/team`);
  return response.data;
}

export const getUserById = async (id) => {
  const response = await axios.get(`${API_URL}/userById/${id}`);
  return response.data;
}
