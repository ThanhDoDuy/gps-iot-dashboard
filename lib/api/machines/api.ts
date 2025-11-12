import { apiClient } from '../client';
import { 
  Machine, 
  CreateMachineRequest, 
  UpdateMachineRequest, 
  MachineFilters,
  MachineStatus
} from './types';
import { ApiResponse, PaginationParams } from '../types';

export class MachinesApi {
  async getMachines(
    accessToken: string,
    params?: PaginationParams & MachineFilters
  ): Promise<ApiResponse<Machine[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/machines${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.authenticatedRequest<ApiResponse<Machine[]>>(endpoint, accessToken);
  }

  async getMachine(accessToken: string, machineId: string): Promise<ApiResponse<Machine>> {
    return apiClient.authenticatedRequest<ApiResponse<Machine>>(`/machines/${machineId}`, accessToken);
  }

  async getUnlinkedMachine(accessToken: string): Promise<ApiResponse<Machine[]>> {
    return apiClient.authenticatedRequest<ApiResponse<Machine[]>>("/machines/unlinked", accessToken);
  }

  async createMachine(accessToken: string, machineData: CreateMachineRequest): Promise<ApiResponse<Machine>> {
    return apiClient.authenticatedRequest<ApiResponse<Machine>>('/machines', accessToken, {
      method: 'POST',
      body: JSON.stringify(machineData),
    });
  }

  async updateMachine(
    accessToken: string, 
    machineId: string, 
    machineData: UpdateMachineRequest
  ): Promise<ApiResponse<Machine>> {
    return apiClient.authenticatedRequest<ApiResponse<Machine>>(`/machines/${machineId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(machineData),
    });
  }


  async getMachineStatus(accessToken: string, machineId: string): Promise<ApiResponse<MachineStatus>> {
    return apiClient.authenticatedRequest<ApiResponse<MachineStatus>>(
      `/machines/${machineId}/status`, 
      accessToken
    );
  }

  async updateMachineStatus(
    accessToken: string, 
    machineId: string, 
    status: 'running' | 'stopped' | 'maintenance'
  ): Promise<ApiResponse<Machine>> {
    return apiClient.authenticatedRequest<ApiResponse<Machine>>(`/machines/${machineId}/status`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async startMachine(accessToken: string, machineId: string): Promise<ApiResponse<Machine>> {
    return apiClient.authenticatedRequest<ApiResponse<Machine>>(`/machines/${machineId}/start`, accessToken, {
      method: 'POST',
    });
  }

  async stopMachine(accessToken: string, machineId: string): Promise<ApiResponse<Machine>> {
    return apiClient.authenticatedRequest<ApiResponse<Machine>>(`/machines/${machineId}/stop`, accessToken, {
      method: 'POST',
    });
  }

  async deleteMachine(accessToken: string, machineId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.authenticatedRequest<{ success: boolean; message: string }>(`/machines/${machineId}`, accessToken, {
      method: 'DELETE',
    });
  }

  async filterMachinesByLocation(
    accessToken: string,
    countryCode?: string,
    cityCode?: string
  ): Promise<{
    success: boolean;
    data: Machine[];
    total: number;
    filters: {
      countryCode: string | null;
      cityCode: string | null;
    };
    message?: string;
  }> {
    const queryParams = new URLSearchParams();
    if (countryCode) queryParams.append('countryCode', countryCode);
    if (cityCode) queryParams.append('cityCode', cityCode);

    const endpoint = `/machines/filter${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.authenticatedRequest<{
      success: boolean;
      data: Machine[];
      total: number;
      filters: {
        countryCode: string | null;
        cityCode: string | null;
      };
      message?: string;
    }>(endpoint, accessToken);
    
    // Ensure response has the expected structure
    return {
      success: response.success ?? true,
      data: response.data || [],
      total: response.total ?? (response.data?.length || 0),
      filters: response.filters || {
        countryCode: countryCode || null,
        cityCode: cityCode || null,
      },
      message: response.message,
    };
  }

  async filterMachinesByRadius(
    accessToken: string,
    countryCode: string,
    cityCode: string,
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<{
    success: boolean;
    data: Machine[];
    total: number;
    filters: {
      countryCode: string;
      cityCode: string;
      centerLat: number;
      centerLng: number;
      radiusKm: number;
    };
    message?: string;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('countryCode', countryCode);
    queryParams.append('cityCode', cityCode);
    queryParams.append('centerLat', centerLat.toString());
    queryParams.append('centerLng', centerLng.toString());
    queryParams.append('radiusKm', radiusKm.toString());

    const endpoint = `/machines/filter-by-radius?${queryParams.toString()}`;
    return apiClient.authenticatedRequest(endpoint, accessToken);
  }

  async linkMachineToDevice(
    accessToken: string,
    machineId: string,
    deviceId: string
  ): Promise<ApiResponse<Machine>> {
    return apiClient.authenticatedRequest<ApiResponse<Machine>>(
      `/machines/${machineId}/link-device`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId }),
      }
    );
  }

  async unlinkMachineFromDevice(
    accessToken: string,
    machineId: string
  ): Promise<ApiResponse<Machine>> {
    return apiClient.authenticatedRequest<ApiResponse<Machine>>(
      `/machines/${machineId}/unlink-device`,
      accessToken,
      {
        method: 'DELETE',
      }
    );
  }
}

export const machinesApi = new MachinesApi();
