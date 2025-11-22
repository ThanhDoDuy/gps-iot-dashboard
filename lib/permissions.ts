/**
 * Permission mapping for menu items
 * Maps each menu item to the required permissions
 * A menu item will be shown if user has ANY of the listed permissions
 */

import { PermissionsEnum } from './enums/permissions.enum'

export interface MenuItem {
  label: string
  href: string
  icon: string
  requiredPermissions: PermissionsEnum[]
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "📊",
    requiredPermissions: [
      PermissionsEnum.DASHBOARD_VIEW,
    ],
  },
  {
    label: "Tenants",
    href: "/dashboard/tenants",
    icon: "🏛️",
    requiredPermissions: [], // Checked by roleId in sidebar instead
  },
  {
    label: "Tenant Info",
    href: "/dashboard/tenant",
    icon: "🏢",
    requiredPermissions: [
      PermissionsEnum.TENANT_VIEW,
    ],
  },
  {
    label: "Machines",
    href: "/dashboard/machines",
    icon: "☕",
    requiredPermissions: [
      PermissionsEnum.MACHINE_VIEW,
    ],
  },
  {
    label: "Devices",
    href: "/dashboard/devices",
    icon: "📱",
    requiredPermissions: [
      PermissionsEnum.DEVICE_VIEW,
    ],
  },
  {
    label: "Locations",
    href: "/dashboard/locations",
    icon: "🌍",
    requiredPermissions: [
      PermissionsEnum.DASHBOARD_VIEW,
    ],
  },
  {
    label: "Mapping",
    href: "/dashboard/mapping",
    icon: "🗺️",
    requiredPermissions: [
      PermissionsEnum.DASHBOARD_VIEW,
    ],
  },
  {
    label: "Radius Filter",
    href: "/dashboard/radius-filter",
    icon: "🎯",
    requiredPermissions: [
      PermissionsEnum.DASHBOARD_VIEW,
    ],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: "👥",
    requiredPermissions: [
      PermissionsEnum.USER_VIEW,
    ],
  },
  {
    label: "Role & Permission",
    href: "/dashboard/roles",
    icon: "🔐",
    requiredPermissions: [
      PermissionsEnum.ROLE_VIEW,
    ],
  },
  {
    label: "Help & Support",
    href: "/dashboard/help",
    icon: "❓",
    requiredPermissions: [], // Public - no permission required
  },
]

/**
 * Filter menu items based on user permissions
 */
export function filterMenuItemsByPermissions(
  menuItems: MenuItem[],
  userPermissions: string[]
): MenuItem[] {
  // SUPER_ADMIN has access to everything
  if (userPermissions.includes(PermissionsEnum.SUPER_ADMIN)) {
    return menuItems;
  }

  return menuItems.filter((item) => {
    // If no permissions required, show the item
    if (item.requiredPermissions.length === 0) {
      return true;
    }

    // Check if user has any of the required permissions
    return item.requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );
  });
}

