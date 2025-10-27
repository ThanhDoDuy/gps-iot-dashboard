// Devices module types
export interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'maintenance';
  location?: string;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceRequest {
  name: string;
  type: string;
  location?: string;
}

export interface UpdateDeviceRequest {
  name?: string;
  type?: string;
  location?: string;
  status?: 'online' | 'offline' | 'maintenance';
}

export interface DeviceFilters {
  type?: string;
  status?: 'online' | 'offline' | 'maintenance';
  location?: string;
  search?: string;
}

export interface DeviceStatus {
  status: 'online' | 'offline' | 'maintenance';
  lastSeen: string;
}
