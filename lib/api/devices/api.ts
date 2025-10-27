import { apiClient } from '../client';
import { 
  Device, 
  CreateDeviceRequest, 
  UpdateDeviceRequest, 
  DeviceFilters,
  DeviceStatus
} from './types';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types';

export class DevicesApi {
  async getDevices(
    accessToken: string,
    params?: PaginationParams & DeviceFilters
  ): Promise<ApiResponse<PaginatedResponse<Device>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/devices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.authenticatedRequest<ApiResponse<PaginatedResponse<Device>>>(endpoint, accessToken);
  }

  async getDevice(accessToken: string, deviceId: string): Promise<ApiResponse<Device>> {
    return apiClient.authenticatedRequest<ApiResponse<Device>>(`/devices/${deviceId}`, accessToken);
  }

  async createDevice(accessToken: string, deviceData: CreateDeviceRequest): Promise<ApiResponse<Device>> {
    return apiClient.authenticatedRequest<ApiResponse<Device>>('/devices', accessToken, {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  }

  async updateDevice(
    accessToken: string, 
    deviceId: string, 
    deviceData: UpdateDeviceRequest
  ): Promise<ApiResponse<Device>> {
    return apiClient.authenticatedRequest<ApiResponse<Device>>(`/devices/${deviceId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(deviceData),
    });
  }

  async deleteDevice(accessToken: string, deviceId: string): Promise<ApiResponse<void>> {
    return apiClient.authenticatedRequest<ApiResponse<void>>(`/devices/${deviceId}`, accessToken, {
      method: 'DELETE',
    });
  }

  async getDeviceStatus(accessToken: string, deviceId: string): Promise<ApiResponse<DeviceStatus>> {
    return apiClient.authenticatedRequest<ApiResponse<DeviceStatus>>(
      `/devices/${deviceId}/status`, 
      accessToken
    );
  }

  async updateDeviceStatus(
    accessToken: string, 
    deviceId: string, 
    status: 'online' | 'offline' | 'maintenance'
  ): Promise<ApiResponse<Device>> {
    return apiClient.authenticatedRequest<ApiResponse<Device>>(`/devices/${deviceId}/status`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}

export const devicesApi = new DevicesApi();
