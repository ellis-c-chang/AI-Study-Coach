// frontend/src/services/gamificationService.js
import API from './api';

export const getUserAchievements = async (userId) => {
  const response = await API.get(`/gamification/user/${userId}/achievements`);
  return response.data;
};

export const getUserPoints = async (userId) => {
  const response = await API.get(`/gamification/user/${userId}/points`);
  return response.data;
};

export const getPointTransactions = async (userId) => {
  const response = await API.get(`/gamification/user/${userId}/transactions`);
  return response.data;
};

export const getLeaderboard = async () => {
  const response = await API.get('/gamification/leaderboard');
  return response.data;
};

export const awardSessionPoints = async (sessionId) => {
  const response = await API.post(`/gamification/award-session-points/${sessionId}`);
  return response.data;
};