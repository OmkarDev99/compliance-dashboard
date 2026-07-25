import api from './api';

export const getTasks = async (params = {}) => {
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const getTask = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const completeTask = async (id) => {
  const response = await api.post(`/tasks/${id}/complete`);
  return response.data;
};

export const reopenTask = async (id) => {
  const response = await api.post(`/tasks/${id}/reopen`);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const transitionTask = async (id, action, comment) => {
  const response = await api.post(`/tasks/${id}/transition`, { action, comment });
  return response.data;
};

export const getComments = async (id) => {
  const response = await api.get(`/tasks/${id}/comments`);
  return response.data;
};

export const addComment = async (id, content) => {
  const response = await api.post(`/tasks/${id}/comments`, { content });
  return response.data;
};
