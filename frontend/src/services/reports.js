import api from './api';

export const getReportsSummary = async (params = {}) => {
  const response = await api.get('/reports/summary', { params });
  return response.data;
};

export const getPartnerDashboard = async (params = {}) => {
  const response = await api.get('/reports/partner-dashboard', { params });
  return response.data;
};

export const getCompanyReport = async (id) => {
  const response = await api.get(`/reports/company/${id}`);
  return response.data;
};

export const getTeamReport = async () => {
  const response = await api.get('/reports/team');
  return response.data;
};

export const getCompaniesReports = async () => {
  const response = await api.get('/reports/companies');
  return response.data;
};
