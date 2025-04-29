// src/services/groupService.js
import API from './api';          // ← 已经在 api.js 里配置了 baseURL/withCredentials

export const getMyGroups = async (user_id) => {
  const { data } = await API.get('/groups/my', { params: { user_id } });
  return data;
};

export const joinGroup = async (user_id, join_code) => {
  const { data } = await API.post('/groups/join', { user_id, join_code });
  return data;
};

export const createGroup = async (groupData) => {
  const { data } = await API.post('/groups', groupData);
  return data;
};

export const leaveGroup = async (user_id, group_id) => {
  const { data } = await API.post('/groups/leave', { user_id, group_id });
  return data;
};

export const addGroupSession = async (groupId, sessionData) => {
  const { data } = await API.post(`/groups/${groupId}/sessions`, sessionData);
  return data;
};

export const getGroupStudySessions = async (groupId) => {
  const { data } = await API.get(`/groups/${groupId}/sessions`);
  return data;
};
