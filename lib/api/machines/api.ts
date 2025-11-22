import { apiClient } from '../client';
import { 
  Machine, 
  CreateMachineRequest, 
  UpdateMachineRequest, 
  MachineFilters,
  MachineStatus,
  PaginatedMachinesResponse
} from './types';
import { ApiResponse } from '../types';

export interface GetAllMachinesParams {
  limit?: number;
  skip?: number;
  search?: string;
  country?: string;
  city?: string;
  status?: string;
}

export class MachinesApi {
  async getMachines(
    accessToken: string,
    params?: GetAllMachinesParams
  ): Promise<PaginatedMachinesResponse> {
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
    if (params?.status) {
      queryParams.append('status', params.status);
    }

    const queryString = queryParams.toString();
    const url = `/machines${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.authenticatedRequest<PaginatedMachinesResponse>(url, accessToken, {
      method: 'GET',
    });
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
