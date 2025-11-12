export interface Device {
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
  ttl: number; // Time to live
  machine_id?: string; // Linked machine ID
}

export interface PaginationMeta {
  total: number;
  limit: number;
  skip: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedDevicesResponse {
  success: boolean;
  data: Device[];
  pagination: PaginationMeta;
  message?: string;
}

export interface DeviceResponse {
  success: boolean;
  data: Device;
  message?: string;
}
