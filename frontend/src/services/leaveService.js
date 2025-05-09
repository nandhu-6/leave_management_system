import axios from 'axios';
const API_URL = `${process.env.REACT_APP_BASE_URL}/leaves`;

export const getLeaveBalance = async () => {
  const response = await axios.get(`${API_URL}/balance`);
  return response.data;
};

export const getMyLeaves = async () => {
  const response = await axios.get(`${API_URL}/my-leaves`);
  return response.data;
};

export const applyLeave = async (FormData) => {
  const response = await axios.post(`${API_URL}/apply`, FormData);
  return response.data;
}

export const cancelLeave = async (leaveId) => {
  const response = await axios.post(`${API_URL}/${leaveId}/cancel`);
  return response.data;
};

export const PendingApprovalsService = async () => { 
  const response = await axios.get(`${API_URL}/pending-approvals`);
  return response.data;
};

export const submitLeaveAction = async (leaveId, action, comment) => {
  return await axios.post(`${API_URL}/${leaveId}/${action}`, {
    action : action.includes('approve')? 'approve' :'reject'  , 
    comment,
  });
};

export const teamLeaves = async() => {
  const response = await axios.get(`${API_URL}/team-leaves`);
  return response.data;
}

export const allLeaves = async() => {
  const response = await axios.get(`${API_URL}/all`);
  return response.data;
}