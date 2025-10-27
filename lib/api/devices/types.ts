export interface Device {
  model: string;
  device_id: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  tenant_id: string;
  machine_id?: string;
  created_at: string;
  updated_at: string;
  linked_time?: string;
  latest_location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
    source: string;
  };
}

export interface CreateDeviceRequest {
  device_id: string;
  model: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  machine_id?: string;
}

export interface UpdateDeviceRequest {
  device_id?: string;
  model?: string;
  status?: 'active' | 'inactive' | 'maintenance' | 'offline';
  machine_id?: string;
}

export interface DeviceResponse {
  success: boolean;
  data: Device;
  message?: string;
}

export interface DevicesResponse {
  success: boolean;
  data: Device[];
  message?: string;
}