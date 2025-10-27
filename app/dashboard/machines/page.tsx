"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { machinesApi } from "@/lib/api/machines"
import { useAuthStore } from "@/lib/auth-store"
import { Machine } from "@/lib/api/machines/types"
import { Edit, Trash2, MoreHorizontal, Save, X, Map } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { MapPicker } from "@/components/ui/map-picker"

export default function MachinesPage() {
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingMachine, setDeletingMachine] = useState<string | null>(null)
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null)
  const [editFormData, setEditFormData] = useState({
    machine_id: "",
    name: "",
    lat: "",
    lng: "",
    radius: "",
    address: ""
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [showEditMapModal, setShowEditMapModal] = useState(false)

  const fetchMachines = async () => {
    
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await machinesApi.getMachines(accessToken);
      setMachines(response.data)
    } catch (err) {
      setError('Failed to load machines')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMachines()
  }, [isAuthenticated, accessToken])

  const filteredMachines = machines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-700"
      case 'inactive':
        return "bg-red-100 text-red-700"
      case 'maintenance':
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const handleViewDetails = (machine: Machine) => {
    router.push(`/dashboard/machines/${machine.machine_id}`)
  }

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine)
    setEditFormData({
      machine_id: machine.machine_id,
      name: machine.name,
      lat: machine.lat.toString(),
      lng: machine.lng.toString(),
      radius: machine.radius.toString(),
      address: machine.address
    })
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUpdateMachine = async () => {
    if (!accessToken || !editingMachine) return

    try {
      setIsUpdating(true)
      
      const updateData = {
        machine_id: editFormData.machine_id,
        name: editFormData.name,
        lat: parseFloat(editFormData.lat),
        lng: parseFloat(editFormData.lng),
        radius: parseFloat(editFormData.radius),
        address: editFormData.address
      }

      await machinesApi.updateMachine(accessToken, editingMachine.machine_id, updateData)
      
      // Update local state
      setMachines(prev => prev.map(m => 
        m.machine_id === editingMachine.machine_id 
          ? { ...m, ...updateData }
          : m
      ))
      
      setEditingMachine(null)
      console.log(`Machine ${editingMachine.machine_id} updated successfully`)
    } catch (err) {
      console.error('Error updating machine:', err)
      alert('Failed to update machine. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingMachine(null);
    setEditFormData({
      machine_id: "",
      name: "",
      lat: "",
      lng: "",
      radius: "",
      address: ""
    });
  };

  const handleEditLocationSelect = (lat: number, lng: number, address: string) => {
    setEditFormData(prev => ({
      ...prev,
      lat: lat.toString(),
      lng: lng.toString(),
      address: address
    }))
    setShowEditMapModal(false)
  }

  const handleDelete = async (machine: Machine) => {
    if (!accessToken) return

    const confirmed = window.confirm(
      `Are you sure you want to delete machine "${machine.name}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeletingMachine(machine.machine_id)
      await machinesApi.deleteMachine(accessToken, machine.machine_id)
      
      // Remove from local state
      setMachines(prev => prev.filter(m => m.machine_id !== machine.machine_id))
      
      console.log(`Machine ${machine.machine_id} deleted successfully`)
    } catch (err) {
      console.error('Error deleting machine:', err)
      alert('Failed to delete machine. Please try again.')
    } finally {
      setDeletingMachine(null)
    }
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Machines</h1>
            <p className="text-muted-foreground mt-1">Manage coffee machines and equipment</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push('/dashboard/machines/create')}
          >
            Add Machine
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Machine Fleet</CardTitle>
            <CardDescription>All machines in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input 
                placeholder="Search machines..." 
                className="bg-input border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchMachines} variant="outline">
                  Retry
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-foreground">Machine ID</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Device ID</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Address</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Last Location Check</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMachines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No machines found matching your search' : 'No machines available'}
                        </td>
                      </tr>
                    ) : (
                      filteredMachines.map((machine) => (
                        <tr key={machine.machine_id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground font-medium">{machine.machine_id}</td>
                          <td className="py-3 px-4 text-foreground">{machine.name}</td>
                          <td className="py-3 px-4 text-foreground font-mono text-xs">{machine.device_id}</td>
                          <td className="py-3 px-4 text-foreground max-w-xs truncate" title={machine.address}>
                            {machine.address}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(machine.status)}`}
                            >
                              {machine.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground text-xs">
                            {formatDate(machine.last_location_check)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-accent hover:bg-accent/10"
                                onClick={() => handleViewDetails(machine)}
                              >
                                Details
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={deletingMachine === machine.machine_id}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleEdit(machine)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(machine)}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    disabled={deletingMachine === machine.machine_id}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {deletingMachine === machine.machine_id ? 'Deleting...' : 'Delete'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Machine Modal */}
        <Dialog open={!!editingMachine} onOpenChange={(open) => !open && handleCancelEdit()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Machine
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_machine_id">Machine ID</Label>
                  <Input
                    id="edit_machine_id"
                    name="machine_id"
                    value={editFormData.machine_id}
                    onChange={handleEditInputChange}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_name">Name *</Label>
                  <Input
                    id="edit_name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_address">Address *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="edit_address"
                      name="address"
                      value={editFormData.address}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <Dialog open={showEditMapModal} onOpenChange={setShowEditMapModal}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3"
                        onClick={() => setShowEditMapModal(true)}
                      >
                        <Map className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Map className="h-5 w-5" />
                          Select Location
                        </DialogTitle>
                      </DialogHeader>
                      <MapPicker
                        onLocationSelect={handleEditLocationSelect}
                        onClose={() => setShowEditMapModal(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-muted-foreground">
                  Type address or click the map icon to select location
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_lat">Latitude *</Label>
                  <Input
                    id="edit_lat"
                    name="lat"
                    type="number"
                    step="any"
                    value={editFormData.lat}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_lng">Longitude *</Label>
                  <Input
                    id="edit_lng"
                    name="lng"
                    type="number"
                    step="any"
                    value={editFormData.lng}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_radius">Radius (meters) *</Label>
                  <Input
                    id="edit_radius"
                    name="radius"
                    type="number"
                    min="1"
                    value={editFormData.radius}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleUpdateMachine}
                  disabled={isUpdating}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isUpdating ? 'Updating...' : 'Update Machine'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
