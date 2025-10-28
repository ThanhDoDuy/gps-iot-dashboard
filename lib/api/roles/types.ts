export interface Role {
  id: string;
  name: string;
  tenant_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  tenant_id: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  granted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionMatrix {
  [permissionId: string]: {
    [roleId: string]: boolean;
  };
}

export interface RolesPermissionsResponse {
  roles: Role[];
  permissions: Permission[];
  matrix: PermissionMatrix;
}

export interface UpdateRolePermissionRequest {
  role_id: string;
  permission_id: string;
  granted: boolean;
}

export interface BulkUpdatePermissionsRequest {
  updates: UpdateRolePermissionRequest[];
}