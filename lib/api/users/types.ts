// Users module types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: string;
}

export interface UserFilters {
  role?: string;
  search?: string;
}
