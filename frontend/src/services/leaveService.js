import axios from 'axios';

const API_BASE_URL = 'http://localhost:7000/leaves';

export const getLeaveBalance = async () => {
  const response = await axios.get(`${API_BASE_URL}/balance`);
  return response.data;
};

export const getMyLeaves = async () => {
  const response = await axios.get(`${API_BASE_URL}/my-leaves`);
  return response.data;
};

export const applyLeave = async (FormData) => {
  const response = await axios.post(`${API_BASE_URL}/apply`, FormData);
  return response.data;
}

export const cancelLeave = async (leaveId) => {
  const response = await axios.post(`${API_BASE_URL}/${leaveId}/cancel`);
  return response.data;
};
