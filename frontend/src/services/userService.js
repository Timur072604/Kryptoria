import apiClient from './apiClient';

const userService = {
  getCurrentUserProfile: () => {
    return apiClient.get('/users/me');
  },

  updateUserProfile: (profileData) => {
    return apiClient.put('/users/me', profileData);
  },

  changePassword: (passwordData) => {
    return apiClient.post('/users/me/change-password', passwordData);
  },

  deleteCurrentUserAccount: () => {
    return apiClient.delete('/users/me');
  },
};

export default userService;