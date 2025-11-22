import { apiClient } from '../client'
import { ApiResponse } from '../types'
import { Tenant, CreateTenantRequest, UpdateTenantRequest, TenantListResponse } from './types'

/**
 * API for Super Admin to manage all tenants
 */
export class TenantsApi {
  /**
   * Get all tenants (Super Admin only)
   */
  async getAllTenants(accessToken: string): Promise<TenantListResponse> {
    return apiClient.authenticatedRequest<TenantListResponse>('/api/tenants', accessToken, {
      method: 'GET',
    })
  }

  /**
   * Create a new tenant (Super Admin only)
   */
  async createTenant(accessToken: string, tenantData: CreateTenantRequest): Promise<ApiResponse<{ newTenant: Tenant; adminAccount: any }>> {
    return apiClient.authenticatedRequest<ApiResponse<{ newTenant: Tenant; adminAccount: any }>>('/api/tenants', accessToken, {
      method: 'POST',
      body: JSON.stringify(tenantData),
    })
  }

  /**
   * Update a tenant (Super Admin only)
   */
  async updateTenant(
    accessToken: string,
    tenantId: string,
    tenantData: UpdateTenantRequest
  ): Promise<ApiResponse<Tenant>> {
    return apiClient.authenticatedRequest<ApiResponse<Tenant>>(`/api/tenants/${tenantId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(tenantData),
    })
  }

  /**
   * Delete a tenant (Super Admin only)
   */
  async deleteTenant(accessToken: string, tenantId: string): Promise<ApiResponse<void>> {
    return apiClient.authenticatedRequest<ApiResponse<void>>(`/api/tenants/${tenantId}`, accessToken, {
      method: 'DELETE',
    })
  }
}

export const tenantsApi = new TenantsApi()

