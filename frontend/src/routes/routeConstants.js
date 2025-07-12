export const ROUTE_PATHS = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  SETTINGS: '/settings',
  
  CIPHER_INFO_BASE: '/ciphers',
  getCipherInfoPath: (cipherId) => `/ciphers/${cipherId}`,

  CAESAR_BASE: '/ciphers/caesar',
  CAESAR_VISUALIZER: '/ciphers/caesar/visualizer',
  CAESAR_EXAMPLE: '/ciphers/caesar/example',
  CAESAR_TASKS_OVERVIEW: '/ciphers/caesar/tasks',
  CAESAR_TASK_BASE: '/ciphers/caesar/tasks',
  getCaesarTaskPath: (taskType) => `/ciphers/caesar/tasks/${taskType}`,

  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS_LIST: '/admin/users',

  NOT_FOUND: '*',
};

export const CAESAR_TASK_TYPES = {
  FIND_KEY: 'find-key',
  ENCRYPT_TEXT: 'encrypt-text',
  DECRYPT_TEXT: 'decrypt-text',
};

export const CIPHER_IDS = {
  CAESAR: 'caesar',
  VIGENERE: 'vigenere',
  PLAYFAIR: 'playfair',
};