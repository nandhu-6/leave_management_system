import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import {loginService} from '../services/authService';
import { getProfile } from '../services/employeeService';


const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // console.log("context",context);
  
  return context;

};

export const AuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await getProfile();
      setEmployee(data);
    } catch (err) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (id, password) => {
    try {
      const data = await loginService(id, password);
      const { token, employee } = data;
      localStorage.setItem('token', token);
      setEmployee(employee);
      return employee;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to login');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setEmployee(null);
  };

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  const value = {
    user: employee,
    loading,
    login,
    // register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 