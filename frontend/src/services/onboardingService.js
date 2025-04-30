// frontend/src/services/onboardingService.js
import API from './api';

export const createProfile = async (profileData) => {
  const response = await API.post('/onboarding/profile', profileData);
  return response.data;
};

export const getProfile = async (userId) => {
  try {
    const response = await API.get(`/onboarding/profile/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error; // Rethrow the error for handling in the component
  }
};

export const updateProfile = async (userId, profileData) => {
  const response = await API.put(`/onboarding/profile/${userId}`, profileData);
  return response.data;
};