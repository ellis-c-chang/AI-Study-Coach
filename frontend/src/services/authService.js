import API from './api';

const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const register = async (userData) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await API.post('/auth/login', userData);
  if (response.data.token) {
    setToken(response.data.token);
  }
  return response.data;
};


// export const register = async (userData) => {
//   const response = await API.post('/auth/register', userData, {
//     withCredentials: true,  
//   });
//   return response.data;
// };

// export const login = async (userData) => {
//   const response = await API.post('/auth/login', userData, {
//     withCredentials: true,  
//   });
//   return response.data;
// };

export const logout = () => {
  localStorage.removeItem('token');
  return true;
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};
