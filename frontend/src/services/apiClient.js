import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';
import i18n from '../i18n';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    try {
        const tokenItem = localStorage.getItem('accessToken');
        if (tokenItem) {
            const token = JSON.parse(tokenItem);
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
    } catch (e) {
        console.warn("[apiClient Interceptor] Could not parse accessToken from localStorage:", e);
    }

    const currentLanguage = i18n.resolvedLanguage || i18n.language;
    if (currentLanguage) {
      const languageCode = currentLanguage.split('-')[0];
      config.headers['Accept-Language'] = languageCode;
    }
    return config;
  },
  (error) => {
    console.error('[apiClient] Request error details:', error.toJSON ? error.toJSON() : error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('[apiClient] Response error data:', error.response?.data);
    return Promise.reject(error);
  }
);

export default apiClient;