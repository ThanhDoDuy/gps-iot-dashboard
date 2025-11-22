/**
 * Types for Super Admin Tenants Management
 */

export interface Tenant {
  id: string
  name: string
  country: string
  plan: 'basic' | 'premium' | 'enterprise'
  status: 'active' | 'inactive' | 'suspended'
  api_key?: string
  adminEmail?: string
  created_at: string
  updated_at?: string
}

export interface CreateTenantRequest {
  id: string
  name: string
  country: string
  plan: 'basic' | 'premium' | 'enterprise'
  status?: 'active' | 'inactive' | 'suspended'
  adminEmail: string
}

export interface UpdateTenantRequest {
  name?: string
  country?: string
  plan?: 'basic' | 'premium' | 'enterprise'
  status?: 'active' | 'inactive' | 'suspended'
}

export interface TenantListResponse {
  success: boolean
  data: Tenant[]
  total: number
  message: string
}

