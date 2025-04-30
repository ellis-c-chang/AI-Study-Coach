import API from './api';

// kanbanService.js
export const getTasks = async () => {
  const response = await API.get('/kanban/');
  return response.data;
};

export const addTask = async (taskData) => {
  const response = await API.post('/kanban/', taskData);
  return response.data;
};

export const updateTask = async (taskId, updatedData) => {
  const response = await API.put(`/kanban/${taskId}`, updatedData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await API.delete(`/kanban/${taskId}`);
  return response.data;
};

