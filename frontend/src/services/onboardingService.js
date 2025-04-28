// frontend/src/services/onboardingService.js
import API from './api';

export const createProfile = async (profileData) => {
  const response = await API.post('/onboarding/profile', profileData);
  return response.data;
};

export const getProfile = async (userId) => {
  const response = await API.get(`/onboarding/profile/${userId}`);
  return response.data;
};

export const updateProfile = async (userId, profileData) => {
  const response = await API.put(`/onboarding/profile/${userId}`, profileData);
  return response.data;
};