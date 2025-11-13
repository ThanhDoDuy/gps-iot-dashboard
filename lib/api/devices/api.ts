import { apiClient } from '../client';
import { PaginatedDevicesResponse, DeviceResponse, Device } from './types';

export interface GetAllDevicesParams {
  limit?: number;
  skip?: number;
  search?: string;
  country?: string;
  city?: string;
}

export const devicesApi = {
  async getAllDevices(
    accessToken: string,
    params?: GetAllDevicesParams
  ): Promise<PaginatedDevicesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.skip !== undefined) {
      queryParams.append('skip', params.skip.toString());
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.country) {
      queryParams.append('country', params.country);
    }
    if (params?.city) {
      queryParams.append('city', params.city);
    }

    const queryString = queryParams.toString();
    const url = `/devices/all${queryString ? `?${queryString}` : ''}`;

    return apiClient.authenticatedRequest<PaginatedDevicesResponse>(url, accessToken, {
      method: 'GET',
    });
  },

  async getDevice(accessToken: string, deviceId: string): Promise<DeviceResponse> {
    return apiClient.authenticatedRequest<DeviceResponse>(`/devices/${deviceId}`, accessToken, {
      method: 'GET',
    });
  },

  async getUnlinkedDevices(accessToken: string): Promise<{ success: boolean; data: Device[]; message?: string }> {
    return apiClient.authenticatedRequest(`/devices/unlinked`, accessToken, {
      method: 'GET',
    });
  },
}
