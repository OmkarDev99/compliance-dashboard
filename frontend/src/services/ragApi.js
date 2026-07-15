import axios from 'axios';

const ragApi = axios.create({
  baseURL: import.meta.env.VITE_RAG_API_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default ragApi;
