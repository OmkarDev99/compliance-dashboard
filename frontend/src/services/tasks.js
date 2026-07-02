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
