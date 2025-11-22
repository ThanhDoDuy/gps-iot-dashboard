import { apiClient } from '../client';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenResponse,
  UserProfile,
} from './types';
import { ApiResponse } from '../types';

export class AuthApi {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    const request: RefreshTokenRequest = { refreshToken };
    return apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh-token', request);
  }

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>('/auth/logout');
  }

  async logoutAll(accessToken: string): Promise<ApiResponse<void>> {
    return apiClient.authenticatedRequest<ApiResponse<void>>('/auth/logout-all', accessToken, {
      method: 'POST',
    });
  }

  async changePassword(
    accessToken: string,
    request: ChangePasswordRequest
  ): Promise<ApiResponse<void>> {
    return apiClient.authenticatedRequest<ApiResponse<void>>('/auth/change-password', accessToken, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>('/auth/forgot-password', request);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>('/auth/reset-password', request);
  }

  async getProfile(accessToken: string): Promise<ApiResponse<UserProfile>> {
    return apiClient.authenticatedRequest<ApiResponse<UserProfile>>('/auth/profile', accessToken, {
      method: 'GET',
    });
  }
}

export const authApi = new AuthApi();
