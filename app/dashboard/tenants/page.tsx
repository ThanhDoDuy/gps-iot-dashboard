"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/lib/auth-store"
import { tenantsApi } from "@/lib/api/tenants/api"
import { Tenant } from "@/lib/api/tenants/types"
import { useToast } from "@/hooks/use-toast"
import { RolesEnum } from "@/lib/enums/roles.enum"
import { Loader2, Search, Plus, Edit, Trash2, MoreHorizontal, Building2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function TenantsPage() {
  const { accessToken, isAuthenticated, user } = useAuthStore()
  const { toast } = useToast()
  
  // Check if user is Super Admin
  const isSuperAdmin = user?.roleId === RolesEnum.SUPER_ADMIN
  
  // State for data
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Modal states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    country: "",
    plan: "basic" as "basic" | "premium" | "enterprise",
    status: "active" as "active" | "inactive" | "suspended",
    adminEmail: "",
  })

  // Check if user is Super Admin
  useEffect(() => {
    if (isAuthenticated && !isSuperAdmin) {
      setError("Access denied. Super Admin role required.")
      setIsLoading(false)
    }
  }, [isAuthenticated, isSuperAdmin])

  // Fetch data from API
  const fetchTenants = async () => {
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false)
      return
    }

    if (!isSuperAdmin) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await tenantsApi.getAllTenants(accessToken)
      setTenants(response.data || [])
    } catch (err: any) {
      console.error('Failed to load tenants:', err)
      setError(err.message || 'Failed to load tenants')
      toast({
        title: "Error",
        description: err.message || "Failed to load tenants",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [isAuthenticated, accessToken])

  const filteredTenants = tenants.filter(tenant =>
    tenant.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-700 border-green-200"
      case 'inactive':
        return "bg-gray-100 text-gray-700 border-gray-200"
      case 'suspended':
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return "bg-purple-100 text-purple-700 border-purple-200"
      case 'premium':
        return "bg-blue-100 text-blue-700 border-blue-200"
      case 'basic':
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCreateTenant = async () => {
    if (!accessToken) return

    try {
      await tenantsApi.createTenant(accessToken, formData)
      await fetchTenants()
      setIsCreateDialogOpen(false)
      resetForm()
      toast({
        title: "Success",
        description: "Tenant created successfully",
      })
    } catch (err: any) {
      console.error('Failed to create tenant:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to create tenant",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTenant = async () => {
    if (!accessToken || !selectedTenant) return

    try {
      await tenantsApi.updateTenant(accessToken, selectedTenant.id, {
        name: formData.name,
        country: formData.country,
        plan: formData.plan,
        status: formData.status,
      })
      await fetchTenants()
      setIsEditDialogOpen(false)
      resetForm()
      setSelectedTenant(null)
      toast({
        title: "Success",
        description: "Tenant updated successfully",
      })
    } catch (err: any) {
      console.error('Failed to update tenant:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to update tenant",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTenant = async () => {
    if (!accessToken || !selectedTenant) return

    try {
      await tenantsApi.deleteTenant(accessToken, selectedTenant.id)
      await fetchTenants()
      setIsDeleteDialogOpen(false)
      setSelectedTenant(null)
      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      })
    } catch (err: any) {
      console.error('Failed to delete tenant:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete tenant",
        variant: "destructive",
      })
    }
  }

  const handleCreateClick = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setFormData({
      id: tenant.id,
      name: tenant.name,
      country: tenant.country,
      plan: tenant.plan,
      status: tenant.status,
      adminEmail: tenant.adminEmail || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      country: "",
      plan: "basic",
      status: "active",
      adminEmail: "",
    })
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-destructive text-lg font-semibold">Access Denied</p>
            <p className="text-muted-foreground mt-2">Super Admin role required to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Loading tenants...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && tenants.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchTenants}>Retry</Button>
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
            <h1 className="text-3xl font-bold text-foreground">Tenants</h1>
            <p className="text-muted-foreground mt-1">Manage all tenants in the system (Super Admin only)</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleCreateClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Tenant List</CardTitle>
            <CardDescription>All tenants in the system ({filteredTenants.length} total)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search tenants by ID, name, country, or email..." 
                  className="bg-input border-border pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Country</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Admin Email</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        {searchTerm ? 'No tenants found matching your search' : 'No tenants found'}
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <tr key={tenant.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-foreground font-mono text-xs">{tenant.id}</td>
                        <td className="py-3 px-4 text-foreground font-medium">{tenant.name}</td>
                        <td className="py-3 px-4 text-foreground">{tenant.country}</td>
                        <td className="py-3 px-4">
                          <Badge className={getPlanColor(tenant.plan)}>
                            {tenant.plan.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(tenant.status)}>
                            {tenant.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground">{tenant.adminEmail || '-'}</td>
                        <td className="py-3 px-4 text-foreground text-xs">
                          {formatDate(tenant.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(tenant)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(tenant)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Tenant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Create a new tenant with an admin account. The tenant ID must be unique.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id">Tenant ID *</Label>
              <Input
                id="id"
                placeholder="acme-corp"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country Code *</Label>
              <Input
                id="country"
                placeholder="US"
                maxLength={2}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Plan *</Label>
              <Select value={formData.plan} onValueChange={(value: any) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adminEmail">Admin Email *</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@acme-corp.com"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTenant} disabled={!formData.id || !formData.name || !formData.country || !formData.adminEmail}>
              Create Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant information. Tenant ID cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-id">Tenant ID</Label>
              <Input
                id="edit-id"
                value={formData.id}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-country">Country Code *</Label>
              <Input
                id="edit-country"
                maxLength={2}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-plan">Plan *</Label>
              <Select value={formData.plan} onValueChange={(value: any) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTenant} disabled={!formData.name || !formData.country}>
              Update Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tenant Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tenant
              <strong> "{selectedTenant?.name}"</strong> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

