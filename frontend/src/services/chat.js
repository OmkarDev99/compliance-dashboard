import api from './api';

export const sendChatMessage = async (question) => {
  try {
    const response = await api.post('/assistant/chat', {
      question,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to get response from chatbot');
  }
};

export const checkChatHealth = async () => {
  try {
    const response = await api.get('/assistant/health');
    return response.data;
  } catch (error) {
    throw new Error('Chat service is unavailable');
  }
};
