import api from './api';

export const getReportsSummary = async () => {
  const response = await api.get('/reports/summary');
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

