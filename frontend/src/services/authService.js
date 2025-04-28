import API from './api';

export const register = async (userData) => {
  const response = await API.post('/auth/register', userData, {
    withCredentials: true,  
  });
  return response.data;
};

export const login = async (userData) => {
  const response = await API.post('/auth/login', userData, {
    withCredentials: true,  
  });
  return response.data;
};
