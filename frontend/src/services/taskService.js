import apiClient from './apiClient';

const taskService = {
  generateCaesarTask: (taskType, params) => {
    let apiTaskType = taskType.toUpperCase().replace('-', '_');

    return apiClient.post(`/tasks/caesar/generate/${apiTaskType}`, params);
  },

  verifyCaesarTaskSolution: (taskType, solution) => {
    let apiTaskType = taskType.toUpperCase().replace('-', '_');
    return apiClient.post(`/tasks/caesar/verify/${apiTaskType}`, solution);
  },
};

export default taskService;