// Machines module types
export interface Machine {
  machine_id: string;
  name: string;
  device_id?: string; // Optional - machine may not be linked to device
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  status_reason?: string; // Reason for inactive status
  address: string;
  lat: number;
  lng: number;
  radius: number;
  linked_time?: string;
  tenant_id: string;
  created_at: string;
  updated_at?: string;
  device?: {
    tenant_id: string;
    device_id: string;
    accuracy: number;
    country: string;
    latitude: number;
    longitude: number;
    model: string;
    site: string;
    ts: number; // Unix timestamp
    ts_iso: string; // ISO timestamp
    ttl: number;
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
