import { apiClient } from '../client';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserFilters
} from './types';
import { PaginatedResponse, PaginationParams } from '../types';

export class UsersApi {
  async getUsers(
    accessToken: string,
    params?: PaginationParams & UserFilters
  ): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.authenticatedRequest<PaginatedResponse<User>>(endpoint, accessToken);
  }

  async getUser(accessToken: string, userId: string): Promise<User> {
    return apiClient.authenticatedRequest<User>(`/users/${userId}`, accessToken);
  }

  async createUser(accessToken: string, userData: CreateUserRequest): Promise<User> {
    return apiClient.authenticatedRequest<User>('/users', accessToken, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(
    accessToken: string, 
    userId: string, 
    userData: UpdateUserRequest
  ): Promise<User> {
    return apiClient.authenticatedRequest<User>(`/users/${userId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(accessToken: string, userId: string): Promise<void> {
    return apiClient.authenticatedRequest<void>(`/users/${userId}`, accessToken, {
      method: 'DELETE',
    });
  }

  async getCurrentUser(accessToken: string): Promise<User> {
    return apiClient.authenticatedRequest<User>('/users/me', accessToken);
  }

  async updateCurrentUser(
    accessToken: string, 
    userData: UpdateUserRequest
  ): Promise<User> {
    return apiClient.authenticatedRequest<User>('/users/me', accessToken, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
}

export const usersApi = new UsersApi();
