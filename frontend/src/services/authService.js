import apiClient from './apiClient';

const authService = {
  register: (username, email, password) => {
    return apiClient.post('/auth/register', { username, email, password });
  },

  login: (username, password) => {
    return apiClient.post('/auth/login', { username, password });
  },

  logout: () => {
    return apiClient.post('/auth/logout');
  },

  refreshToken: (refreshToken) => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  requestPasswordReset: (usernameOrEmail) => {
    return apiClient.post('/auth/request-password-reset', { usernameOrEmail });
  },

  resetPassword: (resetToken, newPassword) => {
    return apiClient.post('/auth/reset-password', { resetToken, newPassword });
  },
};

export default authService;