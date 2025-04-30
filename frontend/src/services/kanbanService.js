import API from './api';

// Get all tasks or tasks for a specific user
export const getTasks = async (userId) => {
  try {
    // If userId is provided, get tasks for that user, otherwise get all tasks
    const url = userId ? `/kanban/user/${userId}` : '/kanban/';
    const response = await API.get(url);
    
    console.log("Task API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API error in getTasks:", error);
    throw error;
  }
};

// Add a new task
export const addTask = async (taskData) => {
  try {
    const response = await API.post('/kanban/', taskData);
    console.log("Add task API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API error in addTask:", error);
    throw error;
  }
};

// Update a task
export const updateTask = async (taskId, updatedData) => {
  try {
    // Since there's no direct endpoint for updating, we might need to use a workaround
    // This is a placeholder and likely needs to be adjusted based on your API
    const response = await API.put(`/kanban/${taskId}`, updatedData);
    console.log("Update task API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API error in updateTask:", error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const response = await API.delete(`/kanban/${taskId}`);
    console.log("Delete task API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API error in deleteTask:", error);
    throw error;
  }
};