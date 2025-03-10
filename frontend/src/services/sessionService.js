import API from './api';

export const createStudySession = async (sessionData) => {
  const response = await API.post('/study_sessions/', sessionData);
  return response.data;
};

export const getStudySessions = async (userId) => {
  const response = await API.get(`/study_sessions/${userId}`);
  return response.data;
};
