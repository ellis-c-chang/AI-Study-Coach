import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ai-study-coach.onrender.com',  // Flask backend URL
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

API.interceptors.response.use(null, async (error) => {
  // If the error is a resource error, delay and retry once
  if (error.message === 'Network Error' || 
      error.code === 'ERR_INSUFFICIENT_RESOURCES') {
    
    console.log('Resource error detected, waiting before retry...');
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the original request configuration
    const originalRequest = error.config;
    
    // Only retry once
    if (!originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Retrying request...');
      return API(originalRequest);
    }
  }
  
  return Promise.reject(error);
});

export default API;
