"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuthStore } from "@/lib/auth-store"
import { rolesApi } from "@/lib/api/roles/api"
import { Role, Permission, PermissionMatrix } from "@/lib/api/roles/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"


export default function RolesPage() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  
  // State for data
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [matrix, setMatrix] = useState<PermissionMatrix>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Array<{ roleId: string; permissionId: string; granted: boolean }>>([])

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
      setMatrix(response.data.matrix)
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
    
    // Update local state immediately for UI responsiveness;
    setMatrix((prev) => ({
      ...prev,
      [permissionId]: {
        ...prev[permissionId],
        [roleId]: newGranted,
      },
    }))

    // Add to pending changes
    setPendingChanges(prev => {
      const existingIndex = prev.findIndex(
        change => change.roleId === roleId && change.permissionId === permissionId
      )
      
      if (existingIndex >= 0) {
        // Update existing change
        const updated = [...prev]
        updated[existingIndex] = { roleId, permissionId, granted: newGranted }
        return updated
      } else {
        // Add new change
        return [...prev, { roleId, permissionId, granted: newGranted }]
      }
    })
  }

  const saveChanges = async () => {
    if (!accessToken || pendingChanges.length === 0) return

    setIsSaving(true)
    try {
      const updates = pendingChanges.map(change => ({
        role_id: change.roleId,
        permission_id: change.permissionId,
        granted: change.granted
      }))
      
      await rolesApi.bulkUpdatePermissions(accessToken, updates)
      setPendingChanges([])
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
                        key={role.id}
                        className="text-center p-3 font-semibold text-foreground bg-muted text-sm min-w-32"
                      >
                        <div className="break-words">{role.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr key={permission.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 font-medium text-foreground bg-muted/30 sticky left-0 z-10 min-w-48">
                        <div>
                          <div className="font-medium">{permission.name}</div>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground mt-1">{permission.description}</div>
                          )}
                        </div>
                      </td>
                      {roles.map((role) => (
                        <td key={`${permission.id}-${role.id}`} className="text-center p-3">
                          <input
                            type="checkbox"
                            checked={matrix[permission.id]?.[role.id] || false}
                            onChange={() => togglePermission(permission.id, role.id)}
                            className="w-5 h-5 cursor-pointer accent-accent"
                          />
                        </td>
                      ))}
                    </tr>
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
