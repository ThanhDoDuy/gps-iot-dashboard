export interface Role {
  role_id: string;
  name: string;
  tenant_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  permission_id: string;
  name: string;
  tenant_id: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  tenant_id: string;
  permission_id: string;
  granted: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolesPermissionsResponse {
  roles: Role[];
  permissions: Permission[];
  role_permissions: RolePermission[];
}

// New response format with matrix
export interface RolesPermissionsMatrixResponse {
  roles: Role[];
  permissions: Permission[];
  matrix: RoleMatrix[];
}

export interface RoleMatrix {
  role_id: string;
  tenant_id: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// Helper type for matrix conversion
export interface PermissionMatrix {
  [permissionId: string]: {
    [roleId: string]: boolean;
  };
}

export interface UpdateRolePermissionRequest {
  role_id: string;
  permission_id: string;
  granted: boolean;
}

export interface BulkUpdatePermissionsRequest {
  updates: UpdateRolePermissionRequest[];
}