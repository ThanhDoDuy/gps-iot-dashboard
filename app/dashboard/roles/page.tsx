"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuthStore } from "@/lib/auth-store"
import { rolesApi } from "@/lib/api/roles/api"
import { Role, Permission, PermissionMatrix, RolePermission, RoleMatrix, CreateRoleRequest } from "@/lib/api/roles/types"
import { usersApi } from "@/lib/api/users/api"
import { User } from "@/lib/api/users/types"
import { rolePermissionsToMatrix, getMatrixChanges, matrixArrayToMatrix } from "@/lib/api/roles/helpers"
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
  
  // State for users (Assign Role tab)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({}) // userId -> roleId
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  
  // State for Create/Delete Role tab
  const [newRoleId, setNewRoleId] = useState("")
  const [newRoleName, setNewRoleName] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

  // Fetch users for Assign Role tab
  const fetchUsers = async () => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    try {
      setIsLoadingUsers(true)
      const response = await usersApi.getUsers(accessToken)
      setUsers(response.data)
      
      // Initialize selected roles with current user roles
      const initialRoles: Record<string, string> = {}
      response.data.forEach(user => {
        initialRoles[user.user_id] = user.role_id
      })
      setSelectedRoles(initialRoles)
    } catch (err) {
      console.error('Failed to load users:', err)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Handle assign role to user
  const handleAssignRole = async (userId: string) => {
    if (!accessToken || !selectedRoles[userId]) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      })
      return
    }

    try {
      setAssigningUserId(userId)
      await usersApi.assignRole(accessToken, userId, selectedRoles[userId])
      
      // Update user role in local state
      setUsers(prevUsers => prevUsers.map(user => 
        user.user_id === userId 
          ? { ...user, role_id: selectedRoles[userId], role_name: roles.find(r => r.role_id === selectedRoles[userId])?.name || user.role_name }
          : user
      ))
      
      toast({
        title: "Success",
        description: "Role assigned successfully",
      })
    } catch (err) {
      console.error('Failed to assign role:', err)
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      })
    } finally {
      setAssigningUserId(null)
    }
  }

  // Handle create role
  const handleCreateRole = async () => {
    if (!accessToken || !newRoleId || !newRoleName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreatingRole(true)
      const roleData: CreateRoleRequest = {
        role_id: newRoleId,
        role_name: newRoleName,
        permissions: selectedPermissions,
      }
      
      await rolesApi.createRoleWithPermissions(accessToken, roleData)
      
      // Refresh roles list
      await fetchRolesPermissions()
      
      // Reset form
      setNewRoleId("")
      setNewRoleName("")
      setSelectedPermissions([])
      
      toast({
        title: "Success",
        description: "Role created successfully",
      })
    } catch (err) {
      console.error('Failed to create role:', err)
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      })
    } finally {
      setIsCreatingRole(false)
    }
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (role: Role) => {
    setRoleToDelete(role)
    setIsDeleteDialogOpen(true)
  }

  // Handle delete role
  const handleDeleteRole = async () => {
    if (!accessToken || !roleToDelete) return

    try {
      setDeletingRoleId(roleToDelete.role_id)
      await rolesApi.deleteRoleById(accessToken, roleToDelete.role_id)
      
      // Refresh roles list
      await fetchRolesPermissions()
      
      // Close dialog
      setIsDeleteDialogOpen(false)
      setRoleToDelete(null)
      
      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
    } catch (err) {
      console.error('Failed to delete role:', err)
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      })
    } finally {
      setDeletingRoleId(null)
    }
  }

  // Toggle permission selection in create role form
  const togglePermissionSelection = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage permissions for each role</p>
        </div>

        <Tabs defaultValue="permissions" className="w-full" onValueChange={(value) => {
          if (value === 'assign-role' && users.length === 0) {
            fetchUsers()
          }
        }}>
          <TabsList>
            <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
            <TabsTrigger value="assign-role">Assign Role</TabsTrigger>
            <TabsTrigger value="create-role">Create Role</TabsTrigger>
            <TabsTrigger value="delete-role">Delete Role</TabsTrigger>
          </TabsList>
          
          <TabsContent value="permissions" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Permission Matrix</CardTitle>
                    <CardDescription>Check the box to grant a permission to a role</CardDescription>
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
          </TabsContent>

          <TabsContent value="assign-role" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Assign Role to Users</CardTitle>
                <CardDescription>View and manage user role assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading users...</p>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-semibold text-foreground bg-muted">Name</th>
                          <th className="text-left p-3 font-semibold text-foreground bg-muted">Email</th>
                          <th className="text-left p-3 font-semibold text-foreground bg-muted">Role</th>
                          <th className="text-left p-3 font-semibold text-foreground bg-muted">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.user_id} className="border-b border-border hover:bg-muted/50">
                            <td className="p-3 text-foreground">{user.full_name}</td>
                            <td className="p-3 text-foreground">{user.email}</td>
                            <td className="p-3">
                              <Select
                                value={selectedRoles[user.user_id] || user.role_id}
                                onValueChange={(value) => {
                                  setSelectedRoles(prev => ({
                                    ...prev,
                                    [user.user_id]: value
                                  }))
                                }}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role.role_id} value={role.role_id}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3">
                              <Button
                                onClick={() => handleAssignRole(user.user_id)}
                                disabled={assigningUserId === user.user_id || selectedRoles[user.user_id] === user.role_id}
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                {assigningUserId === user.user_id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Assigning...
                                  </>
                                ) : (
                                  'Assign'
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-role" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Create New Role</CardTitle>
                <CardDescription>Create a new role with specific permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Role ID</label>
                    <Input
                      value={newRoleId}
                      onChange={(e) => setNewRoleId(e.target.value)}
                      placeholder="e.g., CUSTOM_ROLE_1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Role Name</label>
                    <Input
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g., Custom Role"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Permissions</label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {sortedResourceGroups.map((resource) => (
                      <div key={resource} className="mb-4">
                        <div className="font-semibold text-sm text-foreground mb-2">
                          {resource.toUpperCase()} Permissions
                        </div>
                        <div className="space-y-2 pl-4">
                          {groupedPermissions[resource].map((permission) => (
                            <label
                              key={permission.permission_id}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(permission.permission_id)}
                                onChange={() => togglePermissionSelection(permission.permission_id)}
                                className="w-4 h-4 cursor-pointer accent-primary"
                              />
                              <span className="text-sm text-foreground">{permission.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCreateRole}
                  disabled={isCreatingRole || !newRoleId || !newRoleName}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isCreatingRole ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delete-role" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Delete Roles</CardTitle>
                <CardDescription>View and delete existing roles</CardDescription>
              </CardHeader>
              <CardContent>
                {roles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No roles found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div
                        key={role.role_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div>
                          <div className="font-medium text-foreground">{role.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {role.role_id}</div>
                        </div>
                        <Button
                          onClick={() => openDeleteDialog(role)}
                          disabled={deletingRoleId === role.role_id}
                          variant="destructive"
                          size="sm"
                        >
                          {deletingRoleId === role.role_id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription className="text-black">
                <span style={{ color: '#000000' }}>
                  Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsDeleteDialogOpen(false)
                setRoleToDelete(null)
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRole}
                disabled={deletingRoleId !== null}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deletingRoleId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
