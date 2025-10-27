import { apiClient } from '../client';
import { 
  Tenant, 
  CreateTenantRequest, 
  UpdateTenantRequest, 
  TenantFilters,
  TenantSettings
} from './types';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types';

export class TenantApi {
  async getTenants(
    accessToken: string,
    params?: PaginationParams & TenantFilters
  ): Promise<ApiResponse<PaginatedResponse<Tenant>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/tenants${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.authenticatedRequest<ApiResponse<PaginatedResponse<Tenant>>>(endpoint, accessToken);
  }

  async getTenant(accessToken: string, tenantId: string): Promise<ApiResponse<Tenant>> {
    return apiClient.authenticatedRequest<ApiResponse<Tenant>>(`/tenants/${tenantId}`, accessToken);
  }

  async createTenant(accessToken: string, tenantData: CreateTenantRequest): Promise<ApiResponse<Tenant>> {
    return apiClient.authenticatedRequest<ApiResponse<Tenant>>('/tenants', accessToken, {
      method: 'POST',
      body: JSON.stringify(tenantData),
    });
  }

  async updateTenant(
    accessToken: string, 
    tenantId: string, 
    tenantData: UpdateTenantRequest
  ): Promise<ApiResponse<Tenant>> {
    return apiClient.authenticatedRequest<ApiResponse<Tenant>>(`/tenants/${tenantId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(tenantData),
    });
  }

  async deleteTenant(accessToken: string, tenantId: string): Promise<ApiResponse<void>> {
    return apiClient.authenticatedRequest<ApiResponse<void>>(`/tenants/${tenantId}`, accessToken, {
      method: 'DELETE',
    });
  }

  async getCurrentTenant(accessToken: string): Promise<ApiResponse<Tenant>> {
    return apiClient.authenticatedRequest<ApiResponse<Tenant>>('/tenants/current', accessToken);
  }

  async updateCurrentTenant(
    accessToken: string, 
    tenantData: UpdateTenantRequest
  ): Promise<ApiResponse<Tenant>> {
    return apiClient.authenticatedRequest<ApiResponse<Tenant>>('/tenants/current', accessToken, {
      method: 'PUT',
      body: JSON.stringify(tenantData),
    });
  }

  async updateTenantSettings(
    accessToken: string, 
    tenantId: string, 
    settings: Partial<TenantSettings>
  ): Promise<ApiResponse<Tenant>> {
    return apiClient.authenticatedRequest<ApiResponse<Tenant>>(`/tenants/${tenantId}/settings`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }
}

export const tenantApi = new TenantApi();
