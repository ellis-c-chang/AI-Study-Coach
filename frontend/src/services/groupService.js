import API from './api';

export const getMyGroups = async (userId) => {
  const response = await API.get(`/groups/my?user_id=${userId}`);
  return response.data;
};

export const createGroup = async (data) => {
  const response = await API.post('/groups', data);
  return response.data;
};

export const joinGroup = async (userId, joinCode) => {
  const response = await API.post('/groups/join', {
    user_id: userId,
    join_code: joinCode,
  });
  return response.data;
};

export const leaveGroup = async (userId, groupId) => {
  const response = await API.post('/groups/leave', {
    user_id: userId,
    group_id: groupId,
  });
  return response.data;
};

export const getGroupMembers = async (groupId) => {
  const response = await API.get(`/groups/${groupId}/members`);
  return response.data;
};

export const addGroupSession = async (groupId, sessionData) => {
  const response = await API.post(`/groups/${groupId}/sessions`, sessionData);
  return response.data;
};

export const getGroupStudySessions = async (groupId) => {
  const response = await API.get(`/groups/${groupId}/sessions`);
  return response.data;
};
