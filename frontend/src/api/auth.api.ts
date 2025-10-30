import apiClient from './client';
import type { LoginRequest, LoginResponse } from '../types/api.types';

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
  },
};