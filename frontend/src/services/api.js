import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ai-study-coach.onrender.com' || process.env.REACT_APP_API_URL,  // Flask backend URL
  withCredentials: true,  // For handling cookies if needed later
  headers: {
    'Content-Type': 'application/json'  
  },
});

// Add interceptors to handle token
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
