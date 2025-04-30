import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ai-study-coach.onrender.com';


export const getMyGroups = async (user_id) => {
  const response = await axios.get(`${API_BASE_URL}/groups/my`, {
    params: { user_id }
  });
  return response.data;
};

export const joinGroup = async (user_id, join_code) => {
  const response = await axios.post(`${API_BASE_URL}/groups/join`, {
    user_id,
    join_code
  });
  return response.data;
};

export const createGroup = async (groupData) => {
  const response = await axios.post(`${API_BASE_URL}/groups`, groupData);
  return response.data;
};

export const leaveGroup = async (user_id, group_id) => {
  const response = await axios.post(`${API_BASE_URL}/groups/leave`, {
    user_id,
    group_id
  });
  return response.data;
};


export const addGroupSession = async (groupId, sessionData) => {
  const { data } = await API.post(`/groups/${groupId}/sessions`, sessionData);
  return data;
};

export const getGroupStudySessions = async (groupId) => {
  const { data } = await API.get(`/groups/${groupId}/sessions`);
  return data;
};
