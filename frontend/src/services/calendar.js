import api from './api';

export const getComplianceCalendar = async (params = {}) => (await api.get('/calendar', { params })).data;
