import API from './api';  

export const createStudySession = async (sessionData) => {
  const response = await API.post('/study_sessions/', sessionData);
  return response.data;
};

export const getStudySessions = async (userId) => {
  const response = await API.get(`/study_sessions/${userId}`);
  return response.data;
};

export const completeStudySession = async (sessionId) => {
  const response = await API.put(`/study_sessions/complete/${sessionId}`);
  return response.data;
};

export const updateStudySession = async (sessionId, updatedData) => {
  const response = await API.put(`/study_sessions/${sessionId}`, updatedData);
  return response.data;
};

export const deleteStudySession = async (sessionId) => {
  const response = await API.delete(`/study_sessions/${sessionId}`);
  return response.data;
};
