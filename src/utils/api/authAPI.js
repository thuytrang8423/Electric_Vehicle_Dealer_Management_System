import { apiClient, API_BASE_URL } from '../apiConfig';
import axios from 'axios';

export const authAPI = {
  // Login (no auth token required)
  login: async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password
    });
    return response.data;
  },
};
