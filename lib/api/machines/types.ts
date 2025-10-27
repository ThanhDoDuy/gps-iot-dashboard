// Machines module types
export interface Machine {
  machine_id: string;
  name: string;
  device_id: string;
  status: 'active' | 'inactive' | 'maintenance';
  address: string;
  lat: number;
  lng: number;
  last_known_lat?: number;
  last_known_lng?: number;
  last_location_check: string;
  radius: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMachineRequest {
  machine_id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  address: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  last_known_lat?: number;
  last_known_lng?: number;
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
