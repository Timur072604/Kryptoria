import apiClient from './apiClient';

const adminService = {
  getUsers: (page = 0, size = 10, sortField = 'username', sortDirection = 'asc') => {
    const sortParam = `${sortField},${sortDirection}`;
    return apiClient.get('/admin/users', {
      params: {
        page,
        size,
        sort: sortParam,
      },
    });
  },

  updateUser: (userId, userData) => {
    return apiClient.put(`/admin/users/${userId}`, userData);
  },

  deleteUser: (userId) => {
    return apiClient.delete(`/admin/users/${userId}`);
  },
};

export default adminService;