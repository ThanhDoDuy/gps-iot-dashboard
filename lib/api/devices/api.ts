import { apiClient } from '../client';
import { ApiResponse } from '../types';
import { Device, CreateDeviceRequest, UpdateDeviceRequest, LinkDeviceToMachine } from './types';

export const devicesApi = {
  async getDevices(accessToken: string): Promise<ApiResponse<Device[]>> {
    return apiClient.authenticatedRequest<ApiResponse<Device[]>>('/devices', accessToken, {
      method: 'GET',
    });
  },

  async getUnlinkedDevices(accessToken: string): Promise<ApiResponse<Device[]>> {
    return apiClient.authenticatedRequest<ApiResponse<Device[]>>('/devices/unlinked', accessToken, {
      method: 'GET',
    });
  },

  async linkToMachine(accessToken: string, deviceId: string, deviceData: LinkDeviceToMachine): Promise<ApiResponse<Device>> {
    return apiClient.authenticatedRequest<ApiResponse<Device>>(`/devices/${deviceId}/link-machine`, accessToken, {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  },

  async unlinkFromMachine(accessToken: string, deviceId: string): Promise<ApiResponse<Device>> {
    return apiClient.authenticatedRequest<ApiResponse<Device>>(`/devices/${deviceId}/unlink-machine`, accessToken, {
      method: 'DELETE',
    });
  },

  async getDevice(accessToken: string, deviceId: string): Promise<ApiResponse<Device>> {
    return apiClient.authenticatedRequest<ApiResponse<Device>>(`/devices/${deviceId}`, accessToken, {
      method: 'GET',
    });
  },

  async createDevice(accessToken: string, deviceData: CreateDeviceRequest): Promise<ApiResponse<Device>> {
    return apiClient.authenticatedRequest<ApiResponse<Device>>('/devices', accessToken, {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  },

  async updateDevice(accessToken: string, deviceId: string, updateData: UpdateDeviceRequest): Promise<ApiResponse<Device>> {
    return apiClient.authenticatedRequest<ApiResponse<Device>>(`/devices/${deviceId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  async deleteDevice(accessToken: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.authenticatedRequest<{ success: boolean; message: string }>(`/devices/${deviceId}`, accessToken, {
      method: 'DELETE',
    });
  },
}