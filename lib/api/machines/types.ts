// Machines module types
export interface Machine {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'maintenance';
  location?: string;
  lastMaintenance?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMachineRequest {
  name: string;
  type: string;
  location?: string;
}

export interface UpdateMachineRequest {
  name?: string;
  type?: string;
  location?: string;
  status?: 'running' | 'stopped' | 'maintenance';
}

export interface MachineFilters {
  type?: string;
  status?: 'running' | 'stopped' | 'maintenance';
  location?: string;
  search?: string;
}

export interface MachineStatus {
  status: 'running' | 'stopped' | 'maintenance';
  lastMaintenance?: string;
}
