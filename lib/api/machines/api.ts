import { apiClient } from '../client';
import { 
  Machine, 
  CreateMachineRequest, 
  UpdateMachineRequest, 
  MachineFilters,
  MachineStatus
} from './types';
import { PaginatedResponse, PaginationParams } from '../types';

export class MachinesApi {
  async getMachines(
    accessToken: string,
    params?: PaginationParams & MachineFilters
  ): Promise<PaginatedResponse<Machine>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/machines${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.authenticatedRequest<PaginatedResponse<Machine>>(endpoint, accessToken);
  }

  async getMachine(accessToken: string, machineId: string): Promise<Machine> {
    return apiClient.authenticatedRequest<Machine>(`/machines/${machineId}`, accessToken);
  }

  async createMachine(accessToken: string, machineData: CreateMachineRequest): Promise<Machine> {
    return apiClient.authenticatedRequest<Machine>('/machines', accessToken, {
      method: 'POST',
      body: JSON.stringify(machineData),
    });
  }

  async updateMachine(
    accessToken: string, 
    machineId: string, 
    machineData: UpdateMachineRequest
  ): Promise<Machine> {
    return apiClient.authenticatedRequest<Machine>(`/machines/${machineId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(machineData),
    });
  }

  async deleteMachine(accessToken: string, machineId: string): Promise<void> {
    return apiClient.authenticatedRequest<void>(`/machines/${machineId}`, accessToken, {
      method: 'DELETE',
    });
  }

  async getMachineStatus(accessToken: string, machineId: string): Promise<MachineStatus> {
    return apiClient.authenticatedRequest<MachineStatus>(
      `/machines/${machineId}/status`, 
      accessToken
    );
  }

  async updateMachineStatus(
    accessToken: string, 
    machineId: string, 
    status: 'running' | 'stopped' | 'maintenance'
  ): Promise<Machine> {
    return apiClient.authenticatedRequest<Machine>(`/machines/${machineId}/status`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async startMachine(accessToken: string, machineId: string): Promise<Machine> {
    return apiClient.authenticatedRequest<Machine>(`/machines/${machineId}/start`, accessToken, {
      method: 'POST',
    });
  }

  async stopMachine(accessToken: string, machineId: string): Promise<Machine> {
    return apiClient.authenticatedRequest<Machine>(`/machines/${machineId}/stop`, accessToken, {
      method: 'POST',
    });
  }
}

export const machinesApi = new MachinesApi();
