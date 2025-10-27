// Tenant module types
export interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: string;
  adminEmail: string;
  country: string;
  api_key: string;
  created_at: string;
  updated_at?: string;
  settings?: TenantSettings;
}

export interface TenantSettings {
  timezone: string;
  language: string;
  theme: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  limits: {
    maxUsers: number;
    maxDevices: number;
    maxMachines: number;
  };
}

export interface CreateTenantRequest {
  name: string;
  domain: string;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  status?: 'active' | 'inactive' | 'suspended';
  settings?: Partial<TenantSettings>;
}

export interface TenantFilters {
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
}
