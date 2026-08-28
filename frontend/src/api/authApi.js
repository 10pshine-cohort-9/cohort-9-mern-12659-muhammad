import apiClient from './axios';

export const signupUser = async ({ name, email, password }) => {
  const response = await apiClient.post('/api/auth/signup', { name, email, password });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await apiClient.post('/api/auth/login', { email, password });
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post('/api/auth/logout');
  return response.data;
};

export const refreshAccessToken = async () => {
  const response = await apiClient.post('/api/auth/refresh');
  return response.data;
};
