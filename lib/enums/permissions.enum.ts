/**
 * System Permissions Enum
 * All permissions in the system should be defined here
 * This should match the backend permissions enum
 */
export enum PermissionsEnum {
  // Role Management Permissions
  ROLE_VIEW = 'PERM_ROLE_VIEW',
  ROLE_CREATE = 'PERM_ROLE_CREATE',
  ROLE_UPDATE = 'PERM_ROLE_UPDATE',
  ROLE_DELETE = 'PERM_ROLE_DELETE',
  ROLE_PERMISSION_ASSIGN = 'PERM_ROLE_PERMISSION_ASSIGN',
  
  // User Management Permissions
  USER_VIEW = 'PERM_USER_VIEW',
  USER_CREATE = 'PERM_USER_CREATE',
  USER_UPDATE = 'PERM_USER_UPDATE',
  USER_DELETE = 'PERM_USER_DELETE',
  USER_ASSIGN_ROLE = 'PERM_USER_ASSIGN_ROLE',
  
  // Device Management Permissions
  DEVICE_DATA_VIEW = 'PERM_DEVICE_DATA_VIEW',
  DEVICE_VIEW = 'PERM_DEVICE_VIEW',
  DEVICE_CREATE = 'PERM_DEVICE_CREATE',
  DEVICE_UPDATE = 'PERM_DEVICE_UPDATE',
  DEVICE_DELETE = 'PERM_DEVICE_DELETE',
  DEVICE_CONTROL = 'PERM_DEVICE_CONTROL',
  
  // Machine Management Permissions
  MACHINE_CREATE = 'PERM_MACHINE_CREATE',
  MACHINE_UPDATE = 'PERM_MACHINE_UPDATE',
  MACHINE_DELETE = 'PERM_MACHINE_DELETE',
  MACHINE_VIEW = 'PERM_MACHINE_VIEW',
  MACHINE_LOCATION_VIEW = 'PERM_MACHINE_LOCATION_VIEW',
  
  // Tenant Management Permissions
  TENANT_CREATE = 'PERM_TENANT_CREATE',
  TENANT_UPDATE = 'PERM_TENANT_UPDATE',
  TENANT_DELETE = 'PERM_TENANT_DELETE',
  TENANT_VIEW = 'PERM_TENANT_VIEW',
  
  // Permission Management
  PERMISSION_ROLE_VIEW = 'PERM_PERMISSION_ROLE_VIEW',
  
  // System Administration
  SUPER_ADMIN = 'PERM_SUPER_ADMIN',
  TENANT_ADMIN = 'PERM_TENANT_ADMIN',
  
  // Analytics and Reporting
  ANALYTICS_VIEW = 'PERM_ANALYTICS_VIEW',
  DASHBOARD_VIEW = 'PERM_DASHBOARD_VIEW',
  
  // API Access
  API_ACCESS = 'PERM_API_ACCESS',
}

/**
 * Get all permission values as array
 */
export const ALL_PERMISSIONS = Object.values(PermissionsEnum);

/**
 * Check if a permission exists
 */
export function isValidPermission(permission: string): permission is PermissionsEnum {
  return Object.values(PermissionsEnum).includes(permission as PermissionsEnum);
}

