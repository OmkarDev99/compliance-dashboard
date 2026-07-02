import api from './api';

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// Admin user management calls
export const getUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

// Admin rule management calls
export const getRules = async () => {
  const response = await api.get('/admin/rules');
  return response.data;
};

export const createRule = async (ruleData) => {
  const response = await api.post('/admin/rules', ruleData);
  return response.data;
};

export const updateRule = async (ruleId, ruleData) => {
  const response = await api.put(`/admin/rules/${ruleId}`, ruleData);
  return response.data;
};
