import { Role, Permission, RolePermission, PermissionMatrix, RoleMatrix } from './types';

/**
 * Convert role-permissions array to matrix format for UI
 */
export function rolePermissionsToMatrix(
  roles: Role[],
  permissions: Permission[],
  rolePermissions: RolePermission[]
): PermissionMatrix {
  const matrix: PermissionMatrix = {};

  // Initialize matrix with all false values
  permissions.forEach(permission => {
    matrix[permission.permission_id] = {};
    roles.forEach(role => {
      matrix[permission.permission_id][role.role_id] = false;
    });
  });

  // Set granted permissions to true
  rolePermissions.forEach(rp => {
    if (rp.granted && matrix[rp.permission_id] && matrix[rp.permission_id][rp.role_id] !== undefined) {
      matrix[rp.permission_id][rp.role_id] = true;
    }
  });

  return matrix;
}

/**
 * Convert matrix format to role-permissions array for API
 */
export function matrixToRolePermissions(
  matrix: PermissionMatrix,
  roles: Role[],
  permissions: Permission[]
): RolePermission[] {
  const rolePermissions: RolePermission[] = [];

  permissions.forEach(permission => {
    roles.forEach(role => {
      const granted = matrix[permission.permission_id]?.[role.role_id] || false;
      rolePermissions.push({
        id: `${role.role_id}-${permission.permission_id}`, // Generate unique ID
        role_id: role.role_id,
        tenant_id: role.tenant_id,
        permission_id: permission.permission_id,
        granted,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  });

  return rolePermissions;
}

/**
 * Get changes between current matrix and new matrix
 */
export function getMatrixChanges(
  currentMatrix: PermissionMatrix,
  newMatrix: PermissionMatrix,
  roles: Role[],
  permissions: Permission[]
): RolePermission[] {
  const changes: RolePermission[] = [];

  permissions.forEach(permission => {
    roles.forEach(role => {
      const currentValue = currentMatrix[permission.permission_id]?.[role.role_id] || false;
      const newValue = newMatrix[permission.permission_id]?.[role.role_id] || false;

      if (currentValue !== newValue) {
        changes.push({
          id: `${role.role_id}-${permission.permission_id}`,
          role_id: role.role_id,
          tenant_id: role.tenant_id,
          permission_id: permission.permission_id,
          granted: newValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });
  });

  return changes;
}

/**
 * Apply changes to matrix
 */
export function applyChangesToMatrix(
  matrix: PermissionMatrix,
  changes: RolePermission[]
): PermissionMatrix {
  const newMatrix = { ...matrix };

  changes.forEach(change => {
    if (!newMatrix[change.permission_id]) {
      newMatrix[change.permission_id] = {};
    }
    newMatrix[change.permission_id][change.role_id] = change.granted;
  });

  return newMatrix;
}

/**
 * Convert matrix array to matrix format for UI
 */
export function matrixArrayToMatrix(
  roles: Role[],
  permissions: Permission[],
  matrixArray: RoleMatrix[]
): PermissionMatrix {
  const matrix: PermissionMatrix = {};

  // Initialize matrix with all false values
  permissions.forEach(permission => {
    matrix[permission.permission_id] = {};
    roles.forEach(role => {
      matrix[permission.permission_id][role.role_id] = false;
    });
  });

  // Set granted permissions to true based on matrix array
  matrixArray.forEach(roleMatrix => {
    roleMatrix.permissions.forEach(permissionId => {
      if (matrix[permissionId] && matrix[permissionId][roleMatrix.role_id] !== undefined) {
        matrix[permissionId][roleMatrix.role_id] = true;
      }
    });
  });

  return matrix;
}

/**
 * Convert matrix format to matrix array for API
 */
export function matrixToMatrixArray(
  matrix: PermissionMatrix,
  roles: Role[],
  permissions: Permission[]
): RoleMatrix[] {
  const matrixArray: RoleMatrix[] = [];

  roles.forEach(role => {
    const rolePermissions: string[] = [];
    
    permissions.forEach(permission => {
      if (matrix[permission.permission_id]?.[role.role_id]) {
        rolePermissions.push(permission.permission_id);
      }
    });

    matrixArray.push({
      role_id: role.role_id,
      tenant_id: role.tenant_id,
      permissions: rolePermissions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return matrixArray;
}
