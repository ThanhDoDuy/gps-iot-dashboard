import { apiClient } from '../client';
import { ApiResponse } from '../types';
import { RefreshMachineStatusResponse, CronStatsResponse, ClearStatsResponse } from './types'

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
  async clearCronStats(accessToken: string): Promise<ClearStatsResponse> {
    return apiClient.authenticatedRequest<ClearStatsResponse>('/machine-status/clear-stats', accessToken, {
      method: 'DELETE',
    })
  },

}