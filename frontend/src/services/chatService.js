import API from './api';

export const askAI = async (messageData) => {
  const response = await API.post('/chat/', messageData);
  return response.data;
};
