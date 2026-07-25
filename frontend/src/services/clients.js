import api from './api';

export const getCompanies = async (params = {}) => {
  const response = await api.get('/companies', { params });
  return response.data;
};

export const getCompany = async (id) => {
  const response = await api.get(`/companies/${id}`);
  return response.data;
};

export const createCompany = async (companyData) => {
  const response = await api.post('/companies', companyData);
  return response.data;
};

export const updateCompany = async (id, companyData) => {
  const response = await api.put(`/companies/${id}`, companyData);
  return response.data;
};

export const updateClientAssignment = async (id, assignment) => {
  const response = await api.put(`/clients/${id}/assignment`, assignment);
  return response.data;
};

export const deleteCompany = async (id) => {
  const response = await api.delete(`/companies/${id}`);
  return response.data;
};

export const getCompanyTasks = async (id) => {
  const response = await api.get(`/companies/${id}/tasks`);
  return response.data;
};

export const getCompany360View = async (id) => {
  const response = await api.get(`/companies/${id}/360-view`);
  return response.data;
};
