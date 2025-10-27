import { apiClient } from '../client';
import { 
  Role, 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  RoleFilters
} from './types';
import { PaginatedResponse, PaginationParams } from '../types';

export class RolesApi {
  async getRoles(
    accessToken: string,
    params?: PaginationParams & RoleFilters
  ): Promise<PaginatedResponse<Role>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.permission) queryParams.append('permission', params.permission);

    const endpoint = `/roles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.authenticatedRequest<PaginatedResponse<Role>>(endpoint, accessToken);
  }

  async getRole(accessToken: string, roleId: string): Promise<Role> {
    return apiClient.authenticatedRequest<Role>(`/roles/${roleId}`, accessToken);
  }

  async createRole(accessToken: string, roleData: CreateRoleRequest): Promise<Role> {
    return apiClient.authenticatedRequest<Role>('/roles', accessToken, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async updateRole(
    accessToken: string, 
    roleId: string, 
    roleData: UpdateRoleRequest
  ): Promise<Role> {
    return apiClient.authenticatedRequest<Role>(`/roles/${roleId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async deleteRole(accessToken: string, roleId: string): Promise<void> {
    return apiClient.authenticatedRequest<void>(`/roles/${roleId}`, accessToken, {
      method: 'DELETE',
    });
  }

  async getAvailablePermissions(accessToken: string): Promise<string[]> {
    return apiClient.authenticatedRequest<string[]>('/roles/permissions', accessToken);
  }
}

export const rolesApi = new RolesApi();
