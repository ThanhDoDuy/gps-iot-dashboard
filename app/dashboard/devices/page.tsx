"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { devicesApi } from "@/lib/api/devices"
import { machinesApi } from "@/lib/api/machines"
import { useAuthStore } from "@/lib/auth-store"
import { Device } from "@/lib/api/devices/types"
import { Machine } from "@/lib/api/machines/types"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, MoreHorizontal, Save, X, Plus, Loader2, Wifi } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function DevicesPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingDevice, setDeletingDevice] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editFormData, setEditFormData] = useState({
    device_id: "",
    model: "",
    status: "active" as "active" | "inactive" | "maintenance" | "offline",
    machine_id: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    device_id: "",
    model: "",
    status: "active" as "active" | "inactive" | "maintenance" | "offline",
    machine_id: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchDevices = async () => {
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await devicesApi.getDevices(accessToken);
      setDevices(response.data);
    } catch (err) {
      setError('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMachines = async () => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    try {
      const response = await machinesApi.getUnlinkedMachine(accessToken);
      setMachines(response.data);
    } catch (err) {
      console.error('Failed to load machines:', err);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchMachines();
  }, [isAuthenticated, accessToken]);

  const filteredDevices = devices.filter(device =>
    device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (device.machine_id && device.machine_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-700";
      case 'inactive':
        return "bg-red-100 text-red-700";
      case 'maintenance':
        return "bg-yellow-100 text-yellow-700";
      case 'offline':
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  const handleViewDetails = (device: Device) => {
    router.push(`/dashboard/devices/${device.device_id}`);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setEditFormData({
      device_id: device.device_id,
      model: device.model,
      status: device.status,
      machine_id: device.machine_id || ""
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateDevice = async () => {
    if (!accessToken || !editingDevice) return;

    try {
      setIsUpdating(true);
      
      const updateData = {
        model: editFormData.model,
        status: editFormData.status,
        machine_id: editFormData.machine_id || undefined
      };

      await devicesApi.updateDevice(accessToken, editingDevice.device_id, updateData);
      
      // Update local state
      setDevices(prev => prev.map(d => 
        d.device_id === editingDevice.device_id 
          ? { ...d, ...updateData }
          : d
      ));
      
      setEditingDevice(null);
      toast({
        title: "Success",
        description: "Device updated successfully",
        variant: "default"
      });
    } catch (err) {
      console.error('Error updating device:', err);
      toast({
        title: "Error",
        description: "Failed to update device. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingDevice(null);
    setEditFormData({
      device_id: "",
      model: "",
      status: "active",
      machine_id: ""
    });
  };

  const handleDeleteClick = (device: Device) => {
    setDeviceToDelete(device);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accessToken || !deviceToDelete) return;

    try {
      setDeletingDevice(deviceToDelete.device_id);
      const response = await devicesApi.deleteDevice(accessToken, deviceToDelete.device_id);
      
      toast({
        title: "Success",
        description: response.message || "Device deleted successfully",
        variant: "default"
      });
      
      await fetchDevices();
      setShowDeleteDialog(false);
      setDeviceToDelete(null);
      
    } catch (err) {
      console.error('Error deleting device:', err);
      toast({
        title: "Error",
        description: "Failed to delete device. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingDevice(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeviceToDelete(null);
  };

  // Create Device handlers
  const handleCreateClick = () => {
    setCreateFormData({
      device_id: "",
      model: "",
      status: "active",
      machine_id: ""
    });
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateDevice = async () => {
    if (!accessToken) return;

    if (!createFormData.device_id || !createFormData.model) {
      setCreateError('Device ID and Model are required');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const createData = {
        device_id: createFormData.device_id,
        model: createFormData.model,
        status: createFormData.status,
        machine_id: createFormData.machine_id || undefined
      };

      await devicesApi.createDevice(accessToken, createData);
      
      toast({
        title: "Success",
        description: "Device created successfully",
        variant: "default"
      });
      
      await fetchDevices();
      setShowCreateModal(false);
      setCreateFormData({
        device_id: "",
        model: "",
        status: "active",
        machine_id: ""
      });
      
    } catch (err) {
      console.error('Error creating device:', err);
      setCreateError('Failed to create device. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setCreateFormData({
      device_id: "",
      model: "",
      status: "active",
      machine_id: ""
    });
    setCreateError(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Devices</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage all connected IoT devices</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleCreateClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
            <CardDescription>All devices in your network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input 
                placeholder="Search devices..." 
                className="bg-input border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchDevices} variant="outline">
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
                      <th className="text-left py-3 px-4 font-medium text-foreground">Device ID</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Model</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Machine ID</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Last Seen</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Linked Time</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No devices found matching your search' : 'No devices available'}
                        </td>
                      </tr>
                    ) : (
                      filteredDevices.map((device) => (
                        <tr key={device.device_id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground font-medium">{device.device_id}</td>
                          <td className="py-3 px-4 text-foreground">{device.model}</td>
                          <td className="py-3 px-4 text-foreground font-mono text-xs">
                            {device.machine_id || "Not linked"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(device.status)}`}
                            >
                              {device.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground text-xs">
                            {device.latest_location ? formatDate(device.latest_location.timestamp) : "Never"}
                          </td>
                          <td className="py-3 px-4 text-foreground text-xs">
                            {device.linked_time ? formatDate(device.linked_time) : "Not linked"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-accent hover:bg-accent/10"
                                onClick={() => handleViewDetails(device)}
                              >
                                Details
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={deletingDevice === device.device_id}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleEdit(device)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(device)}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    disabled={deletingDevice === device.device_id}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {deletingDevice === device.device_id ? 'Deleting...' : 'Delete'}
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

        {/* Edit Device Modal */}
        <Dialog open={!!editingDevice} onOpenChange={(open) => !open && handleCancelEdit()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Device
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_device_id">Device ID</Label>
                  <Input
                    id="edit_device_id"
                    name="device_id"
                    value={editFormData.device_id}
                    onChange={handleEditInputChange}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_model">Model *</Label>
                  <Input
                    id="edit_model"
                    name="model"
                    value={editFormData.model}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status *</Label>
                  <select
                    id="edit_status"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {machines.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="edit_machine_id">Link to Machine (Optional)</Label>
                    <select
                      id="edit_machine_id"
                      name="machine_id"
                      value={editFormData.machine_id}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">Select a machine...</option>
                      {machines.map((machine) => (
                        <option key={machine.machine_id} value={machine.machine_id}>
                          {machine.name} ({machine.machine_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleUpdateDevice}
                  disabled={isUpdating}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isUpdating ? 'Updating...' : 'Update Device'}
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
                Delete Device
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete device <strong>"{deviceToDelete?.device_id}"</strong>?
              </p>
              <p className="text-sm text-destructive font-medium">
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleDeleteConfirm}
                  disabled={deletingDevice === deviceToDelete?.device_id}
                  variant="destructive"
                  className="flex-1"
                >
                  {deletingDevice === deviceToDelete?.device_id ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  onClick={handleDeleteCancel}
                  disabled={deletingDevice === deviceToDelete?.device_id}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Device Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Device
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {createError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <X className="h-4 w-4" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-destructive text-sm mt-1">{createError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create_device_id">Device ID *</Label>
                  <Input
                    id="create_device_id"
                    name="device_id"
                    value={createFormData.device_id}
                    onChange={handleCreateInputChange}
                    placeholder="e.g., DEV-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create_model">Model *</Label>
                  <Input
                    id="create_model"
                    name="model"
                    value={createFormData.model}
                    onChange={handleCreateInputChange}
                    placeholder="e.g., ESP32-S3"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create_status">Status *</Label>
                  <select
                    id="create_status"
                    name="status"
                    value={createFormData.status}
                    onChange={handleCreateInputChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {machines.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="create_machine_id">Link to Machine (Optional)</Label>
                    <select
                      id="create_machine_id"
                      name="machine_id"
                      value={createFormData.machine_id}
                      onChange={handleCreateInputChange}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">Select a machine...</option>
                      {machines.map((machine) => (
                        <option key={machine.machine_id} value={machine.machine_id}>
                          {machine.name} ({machine.machine_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleCreateDevice}
                  disabled={isCreating}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isCreating ? 'Creating...' : 'Create Device'}
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
  );
}
