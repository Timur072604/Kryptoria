import apiClient from './apiClient';

const cipherService = {
  getCaesarVisualization: (params) => {
    return apiClient.post('/cipher/visualize', params);
  },
};

export default cipherService;