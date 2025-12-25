import api from './api';
import { User, ApiResponse } from '@/types';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  businessName?: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);

    if (response.data) {
      await api.setToken(response.data.token);
      await api.setRefreshToken(response.data.refreshToken);
    }

    return response;
  },

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/register', data);

    if (response.data) {
      await api.setToken(response.data.token);
      await api.setRefreshToken(response.data.refreshToken);
    }

    return response;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      await api.clearTokens();
    }
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get<User>('/auth/me');
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    return api.post('/auth/reset-password', { token, password });
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return api.patch<User>('/auth/profile', data);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  },
};

export default authService;
