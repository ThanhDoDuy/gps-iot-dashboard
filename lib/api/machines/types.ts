// Machines module types
export interface Machine {
  machine_id: string;
  name: string;
  device_id: string;
  status: 'active' | 'inactive' | 'maintenance';
  address: string;
  lat: number;
  lng: number;
  radius: number;
  linked_time?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  device?: {
    model: string;
    status: string;
    device_id: string;
    latest_location?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: string;
      source: string;
    };
  };
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
  machine_id?: string;
  name?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  address?: string;
  status?: 'active' | 'inactive' | 'maintenance' | 'offline';
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
