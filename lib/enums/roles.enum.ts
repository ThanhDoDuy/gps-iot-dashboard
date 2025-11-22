/**
 * System Roles Enum
 * All predefined roles in the system should be defined here
 * This should match the backend roles enum
 */
export enum RolesEnum {
  // System-wide roles
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
}

/**
 * Get all role values as array
 */
export const ALL_ROLES = Object.values(RolesEnum);

/**
 * Check if a role exists
 */
export function isValidRole(role: string): role is RolesEnum {
  return Object.values(RolesEnum).includes(role as RolesEnum);
}

