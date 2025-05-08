import axios from 'axios';
const API_URL = 'http://localhost:7000/auth';

export const loginService = async (id,password) => {
    const response = await axios.post(`${API_URL}/login`, {id,password});
    return response.data;
}

export const register = async (id, password) => {
    const response = await axios.post(`${API_URL}/register`, {id, password});
    return response.data;
}