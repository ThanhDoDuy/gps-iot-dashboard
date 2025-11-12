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
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, MoreHorizontal, Save, X, Map, Plus, MapPin, Loader2, Search } from "lucide-react"
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
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingMachine, setDeletingMachine] = useState<string | null>(null);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [editFormData, setEditFormData] = useState({
    machine_id: "",
    name: "",
    lat: "",
    lng: "",
    radius: "",
    address: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditMapModal, setShowEditMapModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    machine_id: "",
    name: "",
    lat: "",
    lng: "",
    radius: "",
    address: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreateMapModal, setShowCreateMapModal] = useState(false);

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
  }, [isAuthenticated, accessToken]);

  const filteredMachines = machines.filter(machine => {
    // Status filter
    if (statusFilter !== "all" && machine.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        machine.name.toLowerCase().includes(searchLower) ||
        machine.machine_id.toLowerCase().includes(searchLower) ||
        machine.address.toLowerCase().includes(searchLower) ||
        (machine.device_id && machine.device_id.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Never";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Never";
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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

  const handleDeleteClick = (machine: Machine) => {
    setMachineToDelete(machine);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accessToken || !machineToDelete) return;

    try {
      setDeletingMachine(machineToDelete.machine_id);
      const response = await machinesApi.deleteMachine(accessToken, machineToDelete.machine_id);
      
      // Show success toast
      toast({
        title: "Success",
        description: response.message || "Machine deleted successfully",
        variant: "default"
      });
      
      // Refresh machines list
      await fetchMachines();
      
      // Close dialog
      setShowDeleteDialog(false);
      setMachineToDelete(null);
      
    } catch (err) {
      console.error('Error deleting machine:', err);
      toast({
        title: "Error",
        description: "Failed to delete machine. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingMachine(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setMachineToDelete(null);
  };

  // Create Machine handlers
  const handleCreateClick = () => {
    setCreateFormData({
      machine_id: "",
      name: "",
      lat: "",
      lng: "",
      radius: "",
      address: ""
    });
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setCreateFormData(prev => ({
        ...prev,
        lat: "",
        lng: ""
      }));
      return;
    }

    try {
      setIsGeocoding(true);
      setCreateError(null);

      const improvedAddress = address
        .replace(/\bdistrict\b/gi, '')
        .replace(/\bward\b/gi, '')
        .replace(/\bstreet\b/gi, '')
        .replace(/\broad\b/gi, '')
        .replace(/\bavenue\b/gi, '')
        .trim();

      const searchQueries = [
        `${improvedAddress}, Ho Chi Minh City, Vietnam`,
        `${address}, Ho Chi Minh City, Vietnam`,
        `${improvedAddress}, Vietnam`,
        address
      ];

      let found = false;
      for (const query of searchQueries) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn&addressdetails=1`
          );
          
          if (!response.ok) continue;

          const data = await response.json();
          
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            setCreateFormData(prev => ({
              ...prev,
              lat: lat,
              lng: lon
            }));
            found = true;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!found) {
        setCreateError('Address not found. Please try a more specific address or include "Ho Chi Minh City" in the address.');
        setCreateFormData(prev => ({
          ...prev,
          lat: "",
          lng: ""
        }));
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setCreateError('Failed to get coordinates. Please check your internet connection and try again.');
      setCreateFormData(prev => ({
        ...prev,
        lat: "",
        lng: ""
      }));
    } finally {
      setIsGeocoding(false);
    }
  };

  // Debounced geocoding for create form
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (createFormData.address.trim()) {
        geocodeAddress(createFormData.address);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [createFormData.address]);

  const handleCreateLocationSelect = (lat: number, lng: number, address: string) => {
    setCreateFormData(prev => ({
      ...prev,
      lat: lat.toString(),
      lng: lng.toString(),
      address: address
    }));
    setShowCreateMapModal(false);
    setCreateError(null);
  };

  const handleCreateMachine = async () => {
    if (!accessToken) return;

    // Validation
    if (!createFormData.machine_id || !createFormData.name || !createFormData.radius || !createFormData.address) {
      setCreateError('All required fields must be filled');
      return;
    }

    if (!createFormData.lat || !createFormData.lng) {
      setCreateError('Please wait for coordinates to be calculated from the address');
      return;
    }

    const lat = parseFloat(createFormData.lat);
    const lng = parseFloat(createFormData.lng);
    const radius = parseFloat(createFormData.radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      setCreateError('Invalid coordinates or radius');
      return;
    }

    if (radius <= 0) {
      setCreateError('Radius must be greater than 0');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const createData = {
        machine_id: createFormData.machine_id,
        name: createFormData.name,
        lat: lat,
        lng: lng,
        radius: radius,
        address: createFormData.address,
        status: 'offline' as const
      };

      await machinesApi.createMachine(accessToken, createData);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Machine created successfully",
        variant: "default"
      });
      
      // Refresh machines list
      await fetchMachines();
      
      // Close modal
      setShowCreateModal(false);
      setCreateFormData({
        machine_id: "",
        name: "",
        lat: "",
        lng: "",
        radius: "",
        address: ""
      });
      
    } catch (err) {
      console.error('Error creating machine:', err);
      setCreateError('Failed to create machine. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setCreateFormData({
      machine_id: "",
      name: "",
      lat: "",
      lng: "",
      radius: "",
      address: ""
    });
    setCreateError(null);
  };
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
            onClick={handleCreateClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Machine
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Machine Fleet</CardTitle>
            <CardDescription>All machines in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Input 
                  placeholder="Search by machine_id, name, address, device_id" 
                  className="bg-input border-border pr-10"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">Filter by Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
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
                          <td className="py-3 px-4 text-foreground font-mono text-xs">
                            {machine.device_id || "Not linked"}
                          </td>
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
                            {formatDate(machine.device?.ts_iso || (machine.device?.ts ? new Date(machine.device.ts * 1000).toISOString() : undefined))}
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
                                    onClick={() => handleDeleteClick(machine)}
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Machine
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete machine <strong>"{machineToDelete?.name}"</strong>?
              </p>
              <p className="text-sm text-destructive font-medium">
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleDeleteConfirm}
                  disabled={deletingMachine === machineToDelete?.machine_id}
                  variant="destructive"
                  className="flex-1"
                >
                  {deletingMachine === machineToDelete?.machine_id ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  onClick={handleDeleteCancel}
                  disabled={deletingMachine === machineToDelete?.machine_id}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Machine Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Machine
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {createError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-destructive">
                      <X className="h-4 w-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    {createError.includes('Address not found') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => geocodeAddress(createFormData.address)}
                        disabled={isGeocoding}
                        className="text-xs"
                      >
                        {isGeocoding ? 'Searching...' : 'Try Again'}
                      </Button>
                    )}
                  </div>
                  <p className="text-destructive text-sm mt-1">{createError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create_machine_id">Machine ID *</Label>
                  <Input
                    id="create_machine_id"
                    name="machine_id"
                    value={createFormData.machine_id}
                    onChange={handleCreateInputChange}
                    placeholder="e.g., KOFIX-MACHINE-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create_name">Machine Name *</Label>
                  <Input
                    id="create_name"
                    name="name"
                    value={createFormData.name}
                    onChange={handleCreateInputChange}
                    placeholder="e.g., NIN-JA"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create_address">Address *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="create_address"
                      name="address"
                      value={createFormData.address}
                      onChange={handleCreateInputChange}
                      placeholder="e.g., 778 Xo Viet Nghe Tinh, Binh Thanh, Ho Chi Minh City"
                      required
                    />
                    {isGeocoding && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Dialog open={showCreateMapModal} onOpenChange={setShowCreateMapModal}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3"
                        onClick={() => setShowCreateMapModal(true)}
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
                        onLocationSelect={handleCreateLocationSelect}
                        onClose={() => setShowCreateMapModal(false)}
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
                  <Label htmlFor="create_lat">Latitude</Label>
                  <div className="relative">
                    <Input
                      id="create_lat"
                      name="lat"
                      type="text"
                      value={createFormData.lat}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Auto-calculated"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create_lng">Longitude</Label>
                  <div className="relative">
                    <Input
                      id="create_lng"
                      name="lng"
                      type="text"
                      value={createFormData.lng}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Auto-calculated"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create_radius">Radius (meters) *</Label>
                  <Input
                    id="create_radius"
                    name="radius"
                    type="number"
                    min="1"
                    value={createFormData.radius}
                    onChange={handleCreateInputChange}
                    placeholder="e.g., 50"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleCreateMachine}
                  disabled={isCreating}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isCreating ? 'Creating...' : 'Create Machine'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCancelCreate}
                  disabled={isCreating}
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
