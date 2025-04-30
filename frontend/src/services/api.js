import axios from 'axios';

cconst API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL   // ← 生产环境用 Vercel 注入的变量
    || 'http://127.0.0.1:5000',     // ← 本地开发 fallback
  withCredentials: true,
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
