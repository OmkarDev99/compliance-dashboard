import api from './api';

export const getRegulatoryUpdates = async (params = {}) => {
  const response = await api.get('/regulatory-updates', { params });
  return response.data;
};
