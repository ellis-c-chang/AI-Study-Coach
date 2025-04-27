import axios from 'axios';
import { getToken } from './authService';

const API = axios.create({
  baseURL: 'http://127.0.0.1:5000',  // Flask backend URL
  withCredentials: true,  // For handling cookies if needed later
});

API.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
