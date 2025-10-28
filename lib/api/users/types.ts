// User module types
export interface User {
  user_id: string;
  email: string;
  full_name: string;
  role_name: string;
  role_id: string;
  tenant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  timezone?: string;
  language?: string;
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  role_id: string;
  password: string;
  profile?: Partial<UserProfile>;
}

export interface UpdateUserRequest {
  full_name?: string;
  role_id?: string;
  is_active?: boolean;
  profile?: Partial<UserProfile>;
}

export interface UserFilters {
  is_active?: boolean;
  role?: string;
  search?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}