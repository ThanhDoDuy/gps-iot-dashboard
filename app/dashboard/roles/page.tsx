"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuthStore } from "@/lib/auth-store"
import { rolesApi } from "@/lib/api/roles/api"
import { Role, Permission, PermissionMatrix, RolePermission, RoleMatrix } from "@/lib/api/roles/types"
import { rolePermissionsToMatrix, getMatrixChanges, applyChangesToMatrix, matrixArrayToMatrix } from "@/lib/api/roles/helpers"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"


export default function RolesPage() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  
  // State for data
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([])
  const [matrix, setMatrix] = useState<PermissionMatrix>({})
  const [originalMatrix, setOriginalMatrix] = useState<PermissionMatrix>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((groups, permission) => {
    const resource = permission.resource
    if (!groups[resource]) {
      groups[resource] = []
    }
    groups[resource].push(permission)
    return groups
  }, {} as Record<string, Permission[]>)

  // Sort permissions within each group by action
  const actionOrder = ['view', 'create', 'update', 'delete', 'control', 'view_data', 'view_location', 'assign_role', 'assign_permissions', 'admin', 'access']
  
  Object.keys(groupedPermissions).forEach(resource => {
    groupedPermissions[resource].sort((a, b) => {
      const aIndex = actionOrder.indexOf(a.action)
      const bIndex = actionOrder.indexOf(b.action)
      if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  })

  // Sort resource groups
  const resourceOrder = ['system', 'tenant', 'role', 'user', 'device', 'machine', 'dashboard', 'analytics', 'api']
  const sortedResourceGroups = Object.keys(groupedPermissions).sort((a, b) => {
    const aIndex = resourceOrder.indexOf(a)
    const bIndex = resourceOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  // Fetch data from API
  const fetchRolesPermissions = async () => {
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await rolesApi.getRolesPermissions(accessToken)
      setRoles(response.data.roles)
      setPermissions(response.data.permissions)
      
      // Check if response has matrix array (new format) or role_permissions (old format)
      let matrixData: PermissionMatrix
      
      if ('matrix' in response.data && Array.isArray(response.data.matrix)) {
        // New format with matrix array
        const matrixArray = response.data.matrix as RoleMatrix[]
        matrixData = matrixArrayToMatrix(
          response.data.roles,
          response.data.permissions,
          matrixArray
        )
        // Convert matrix array to role_permissions for compatibility
        const rolePermissionsArray: RolePermission[] = []
        matrixArray.forEach(roleMatrix => {
          roleMatrix.permissions.forEach(permissionId => {
            rolePermissionsArray.push({
              id: `${roleMatrix.role_id}-${permissionId}`,
              role_id: roleMatrix.role_id,
              tenant_id: roleMatrix.tenant_id,
              permission_id: permissionId,
              granted: true,
              created_at: roleMatrix.created_at,
              updated_at: roleMatrix.updated_at,
            })
          })
        })
        setRolePermissions(rolePermissionsArray)
      } else {
        // Old format with role_permissions array
        setRolePermissions(response.data.role_permissions)
        matrixData = rolePermissionsToMatrix(
          response.data.roles,
          response.data.permissions,
          response.data.role_permissions
        )
      }
      
      setMatrix(matrixData)
      setOriginalMatrix(JSON.parse(JSON.stringify(matrixData))) // Deep copy
    } catch (err) {
      console.error('Failed to load roles and permissions:', err)
      setError('Failed to load roles and permissions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRolesPermissions()
  }, [isAuthenticated, accessToken])

  const togglePermission = (permissionId: string, roleId: string) => {
    const newGranted = !matrix[permissionId]?.[roleId]
    
    // Update local state immediately for UI responsiveness
    setMatrix((prev) => ({
      ...prev,
      [permissionId]: {
        ...prev[permissionId],
        [roleId]: newGranted,
      },
    }))
  }

  // Calculate pending changes
  const pendingChanges = getMatrixChanges(originalMatrix, matrix, roles, permissions)

  const saveChanges = async () => {
    if (!accessToken || pendingChanges.length === 0) return

    setIsSaving(true)
    try {
      // Convert changes to API format
      const updates = pendingChanges.map(change => ({
        role_id: change.role_id,
        permission_id: change.permission_id,
        granted: change.granted
      }))
      
      await rolesApi.bulkUpdatePermissions(accessToken, updates)
      
      // Update original matrix to current matrix
      setOriginalMatrix(JSON.parse(JSON.stringify(matrix)))
      
      toast({
        title: "Success",
        description: `Updated ${pendingChanges.length} permission(s) successfully`,
      })
    } catch (err) {
      console.error('Failed to save changes:', err)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading roles and permissions...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchRolesPermissions}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-muted-foreground mt-1">Manage permissions for each role</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingChanges.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {pendingChanges.length} pending change(s)
              </span>
            )}
            <Button 
              onClick={saveChanges}
              disabled={pendingChanges.length === 0 || isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>Check the box to grant a permission to a role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-foreground bg-muted sticky left-0 z-10 min-w-48">
                      Permissions
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role.role_id}
                        className="text-center p-3 font-semibold text-foreground bg-muted text-sm min-w-32"
                      >
                        <div className="break-words">{role.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedResourceGroups.map((resource) => (
                    <React.Fragment key={resource}>
                      {/* Resource Group Header */}
                      <tr className="bg-muted/50 border-b border-border">
                        <td className="p-3 font-semibold text-foreground bg-muted/50 sticky left-0 z-10 min-w-48">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm uppercase tracking-wide">{resource} Permissions</span>
                          </div>
                        </td>
                        {roles.map((role) => (
                          <td key={`${resource}-${role.role_id}`} className="text-center p-3">
                            <div className="text-xs text-muted-foreground font-medium">
                              {groupedPermissions[resource].filter(perm => 
                                matrix[perm.permission_id]?.[role.role_id]
                              ).length} / {groupedPermissions[resource].length}
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* Permissions in this resource group */}
                      {groupedPermissions[resource].map((permission) => (
                        <tr key={permission.permission_id} className="border-b border-border hover:bg-muted/50">
                          <td className="p-3 font-medium text-foreground bg-muted/30 sticky left-0 z-10 min-w-48">
                            <div className="pl-4">
                              <div className="font-medium">{permission.name}</div>
                              {permission.description && (
                                <div className="text-xs text-muted-foreground mt-1">{permission.description}</div>
                              )}
                            </div>
                          </td>
                          {roles.map((role) => (
                            <td key={`${permission.permission_id}-${role.role_id}`} className="text-center p-3">
                              <input
                                type="checkbox"
                                checked={matrix[permission.permission_id]?.[role.role_id] || false}
                                onChange={() => togglePermission(permission.permission_id, role.role_id)}
                                className="w-5 h-5 cursor-pointer accent-accent"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
