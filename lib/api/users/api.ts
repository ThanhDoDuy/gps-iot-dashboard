import { apiClient } from '../client';
import { ApiResponse, PaginationParams } from '../types';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserFilters,
  ChangePasswordRequest,
  ResetPasswordRequest,
  UserRole
} from './types';

export class UsersApi {
  async getUsers(
    accessToken: string,
    params?: PaginationParams & UserFilters
  ): Promise<ApiResponse<User[]> & { total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.authenticatedRequest<ApiResponse<User[]> & { total: number }>(endpoint, accessToken);
  }

  async getUser(accessToken: string, userId: string): Promise<ApiResponse<User>> {
    return apiClient.authenticatedRequest<ApiResponse<User>>(`/users/${userId}`, accessToken);
  }

  async createUser(accessToken: string, userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.authenticatedRequest<ApiResponse<User>>('/users', accessToken, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(accessToken: string, userId: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.authenticatedRequest<ApiResponse<User>>(`/users/${userId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(accessToken: string, userId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.authenticatedRequest<ApiResponse<{ success: boolean; message: string }>>(`/users/${userId}`, accessToken, {
      method: 'DELETE',
    });
  }

  async changePassword(accessToken: string, userId: string, passwordData: ChangePasswordRequest): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.authenticatedRequest<ApiResponse<{ success: boolean }>>(`/users/${userId}/change-password`, accessToken, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async resetPassword(accessToken: string, resetData: ResetPasswordRequest): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.authenticatedRequest<ApiResponse<{ success: boolean; message: string }>>('/users/reset-password', accessToken, {
      method: 'POST',
      body: JSON.stringify(resetData),
    });
  }

  async getUserRoles(accessToken: string): Promise<ApiResponse<UserRole[]>> {
    return apiClient.authenticatedRequest<ApiResponse<UserRole[]>>('/users/roles', accessToken);
  }

  async updateUserRole(accessToken: string, userId: string, roleId: string): Promise<ApiResponse<User>> {
    return apiClient.authenticatedRequest<ApiResponse<User>>(`/users/${userId}/role`, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ role_id: roleId }),
    });
  }

  async updateUserStatus(accessToken: string, userId: string, isActive: boolean): Promise<ApiResponse<User>> {
    return apiClient.authenticatedRequest<ApiResponse<User>>(`/users/${userId}/status`, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  }
}

export const usersApi = new UsersApi();