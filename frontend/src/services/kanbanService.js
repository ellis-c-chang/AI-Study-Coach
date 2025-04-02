import API from './api';

export const getTasks = async () => {
  const response = await API.get('/tasks/');
  return response.data;
};

export const addTask = async (taskData) => {
  const response = await API.post('/tasks/', taskData);
  return response.data;
};

export const updateTask = async (taskId, updatedData) => {
  const response = await API.put(`/tasks/${taskId}`, updatedData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await API.delete(`/tasks/${taskId}`);
  return response.data;
};
