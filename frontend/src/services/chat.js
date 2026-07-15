import ragApi from './ragApi';

export const sendChatMessage = async (question) => {
  try {
    const response = await ragApi.post('/chat', {
      question,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to get response from chatbot');
  }
};

export const checkChatHealth = async () => {
  try {
    const response = await ragApi.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Chat service is unavailable');
  }
};
