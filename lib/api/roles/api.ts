import { apiClient } from '../client';
import { ApiResponse } from '../types';
import { 
  Role, 
  Permission, 
  RolesPermissionsResponse, 
  UpdateRolePermissionRequest,
  BulkUpdatePermissionsRequest 
} from './types';

export const rolesApi = {
  async getRoles(accessToken: string): Promise<ApiResponse<Role[]>> {
    return apiClient.authenticatedRequest<ApiResponse<Role[]>>('/roles', accessToken, {
      method: 'GET',
    });
  },

  async getPermissions(accessToken: string): Promise<ApiResponse<Permission[]>> {
    return apiClient.authenticatedRequest<ApiResponse<Permission[]>>('/permissions', accessToken, {
      method: 'GET',
    });
  },

  async getRolesPermissions(accessToken: string): Promise<ApiResponse<RolesPermissionsResponse>> {
    return apiClient.authenticatedRequest<ApiResponse<RolesPermissionsResponse>>('/roles-permissions', accessToken, {
      method: 'GET',
    });
  },

  async updateRolePermission(
    accessToken: string, 
    roleId: string, 
    permissionId: string, 
    granted: boolean
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.authenticatedRequest<ApiResponse<{ success: boolean }>>(
      `/roles/${roleId}/permissions/${permissionId}`, 
      accessToken, 
      {
        method: 'PUT',
        body: JSON.stringify({ granted }),
      }
    );
  },

  async bulkUpdatePermissions(
    accessToken: string, 
    updates: UpdateRolePermissionRequest[]
  ): Promise<ApiResponse<{ success: boolean; updated: number }>> {
    return apiClient.authenticatedRequest<ApiResponse<{ success: boolean; updated: number }>>(
      '/roles-permissions/bulk-update', 
      accessToken, 
      {
        method: 'POST',
        body: JSON.stringify({ updates }),
      }
    );
  },

  async createRole(accessToken: string, roleData: { name: string; description?: string }): Promise<ApiResponse<Role>> {
    return apiClient.authenticatedRequest<ApiResponse<Role>>('/roles', accessToken, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  async updateRole(accessToken: string, roleId: string, roleData: { name: string; description?: string }): Promise<ApiResponse<Role>> {
    return apiClient.authenticatedRequest<ApiResponse<Role>>(`/roles/${roleId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  },

  async deleteRole(accessToken: string, roleId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.authenticatedRequest<ApiResponse<{ success: boolean }>>(`/roles/${roleId}`, accessToken, {
      method: 'DELETE',
    });
  },

  async createPermission(accessToken: string, permissionData: { name: string; description?: string; resource: string; action: string }): Promise<ApiResponse<Permission>> {
    return apiClient.authenticatedRequest<ApiResponse<Permission>>('/permissions', accessToken, {
      method: 'POST',
      body: JSON.stringify(permissionData),
    });
  },

  async updatePermission(accessToken: string, permissionId: string, permissionData: { name: string; description?: string; resource: string; action: string }): Promise<ApiResponse<Permission>> {
    return apiClient.authenticatedRequest<ApiResponse<Permission>>(`/permissions/${permissionId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(permissionData),
    });
  },

  async deletePermission(accessToken: string, permissionId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.authenticatedRequest<ApiResponse<{ success: boolean }>>(`/permissions/${permissionId}`, accessToken, {
      method: 'DELETE',
    });
  },
};