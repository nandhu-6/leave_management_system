import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BASE_URL}/auth`;

export const loginService = async (id, password) => {
    console.log("react :", process.env.REACT_APP_BASE_URL);
    const response = await axios.post(`${API_URL}/login`, { id, password });
    console.log("response", response);
    

    return response.data;
};

export const register = async (id, password) => {
    const response = await axios.post(`${API_URL}/register`, { id, password });
    return response.data;
};
