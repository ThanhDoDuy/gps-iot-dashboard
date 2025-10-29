import { apiClient } from '../client';
import { ApiResponse } from '../types';
import { DashboardData, DashboardFilters } from './types';

export const dashboardApi = {
  /**
   * Get dashboard overview data
   */
  async getDashboardData(accessToken: string, filters?: DashboardFilters): Promise<ApiResponse<DashboardData>> {
    const params = new URLSearchParams();
    
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }
    
    const endpoint = `/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.authenticatedRequest<ApiResponse<DashboardData>>(endpoint, accessToken, {
      method: 'GET',
    });
  },

  /**
   * Get dashboard statistics only
   */
  async getStats(accessToken: string, filters?: DashboardFilters): Promise<ApiResponse<DashboardData['stats']>> {
    const params = new URLSearchParams();
    params.append('statsOnly', 'true');
    
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }

    const endpoint = `/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.authenticatedRequest<ApiResponse<DashboardData['stats']>>(endpoint, accessToken, {
      method: 'GET',
    });
  },

  /**
   * Get chart data for specific time range
   */
  async getChartData(accessToken: string, filters?: DashboardFilters): Promise<ApiResponse<DashboardData['chartData']>> {
    const params = new URLSearchParams();
    params.append('chartOnly', 'true');
    
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }

    const endpoint = `/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.authenticatedRequest<ApiResponse<DashboardData['chartData']>>(endpoint, accessToken, {
      method: 'GET',
    });
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(accessToken: string, filters?: DashboardFilters): Promise<ApiResponse<DashboardData['recentActivity']>> {
    const params = new URLSearchParams();
    params.append('activityOnly', 'true');
    
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }


    const endpoint = `/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.authenticatedRequest<ApiResponse<DashboardData['recentActivity']>>(endpoint, accessToken, {
      method: 'GET',
    });
  },

  /**
   * Refresh dashboard data (force reload)
   */
  async refreshDashboard(accessToken: string, filters?: DashboardFilters): Promise<ApiResponse<DashboardData>> {
    const params = new URLSearchParams();
    params.append('refresh', 'true');
    
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }


    const endpoint = `/dashboard/refresh${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.authenticatedRequest<ApiResponse<DashboardData>>(endpoint, accessToken, {
      method: 'GET',
    });
  }
};
