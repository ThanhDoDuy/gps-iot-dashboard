import { apiClient } from '../client';
import { ApiResponse } from '../types';
import { RefreshMachineStatusResponse, CronStatsResponse, ClearStatsResponse, GetTenantConfigsResponse, SetTenantConfigRequest } from './types'

export const settingsApi = {
  /** 
   * Refresh machine status for all machines
   */
  async refreshMachineStatus(accessToken: string): Promise<ApiResponse<RefreshMachineStatusResponse>> {
    return apiClient.authenticatedRequest<ApiResponse<RefreshMachineStatusResponse>>('/machine-status/refresh', accessToken, {
      method: 'POST',
    })
  },

  /**
   * Get cron job statistics
   */
  async getCronStats(accessToken: string): Promise<ApiResponse<CronStatsResponse>> {
    return apiClient.authenticatedRequest<ApiResponse<CronStatsResponse>>('/machine-status/stats', accessToken, {
      method: 'GET',
    })
  },

  /**
   * Clear cron job statistics
   */
  async clearCronStats(accessToken: string): Promise<ApiResponse<ClearStatsResponse>> {
    return apiClient.authenticatedRequest<ApiResponse<ClearStatsResponse>>('/machine-status/clear-stats', accessToken, {
      method: 'DELETE',
    })
  },

  /**
   * Get tenant config by key (LOCATION_STALE_MS)
   */
  // Get all tenant configs as an array of key-value items
  async getTenantConfigs(accessToken: string): Promise<ApiResponse<GetTenantConfigsResponse>> {
    const endpoint = `/system-config`;
    return apiClient.authenticatedRequest<ApiResponse<GetTenantConfigsResponse>>(endpoint, accessToken, {
      method: 'GET',
    })
  },

  /**
   * Set tenant config (LOCATION_STALE_MS)
   */
  // Set tenant configs from a key-value array
  async setTenantConfigs(accessToken: string, payload: SetTenantConfigRequest): Promise<ApiResponse<GetTenantConfigsResponse>> {
    const endpoint = `/system-config`;
    return apiClient.authenticatedRequest<ApiResponse<GetTenantConfigsResponse>>(endpoint, accessToken, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },

}