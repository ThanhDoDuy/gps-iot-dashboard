"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuthStore } from "@/lib/auth-store"
import { devicesApi } from "@/lib/api/devices/api"
import { machinesApi } from "@/lib/api/machines/api"
import { Device } from "@/lib/api/devices/types"
import { Machine } from "@/lib/api/machines/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function MappingPage() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  
  // State for data
  const [devices, setDevices] = useState<Device[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [unlinkedDevices, setUnlinkedDevices] = useState<Device[]>([])
  const [unlinkedMachines, setUnlinkedMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for device addresses
  const [deviceAddresses, setDeviceAddresses] = useState<Record<string, string>>({})
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<Record<string, boolean>>({})
  const geocodedDevices = useRef<Set<string>>(new Set())
  
  // State for linking
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null)

  // Fetch data from API
  const fetchDevices = async () => {
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false)
      return
    }

    try {
      const response = await devicesApi.getDevices(accessToken);
      setDevices(response.data);
    } catch (err) {
      console.error('Failed to load devices:', err);
      setError('Failed to load devices');
    }
  }

  const fetchMachines = async () => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    try {
      const response = await machinesApi.getMachines(accessToken)
      setMachines(response.data)
    } catch (err) {
      console.error('Failed to load machines:', err)
      setError('Failed to load machines')
    }
  }

  const fetchUnlinkedDevices = async () => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    try {
      const response = await devicesApi.getUnlinkedDevices(accessToken)
      setUnlinkedDevices(response.data)
    } catch (err) {
      console.error('Failed to load unlinked devices:', err)
      setError('Failed to load unlinked devices')
    }
  }

  const fetchUnlinkedMachines = async () => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    try {
      const response = await machinesApi.getUnlinkedMachine(accessToken);
      setUnlinkedMachines(response.data)
    } catch (err) {
      console.error('Failed to load unlinked machines:', err)
      setError('Failed to load unlinked machines')
    }
  }

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    // Clear geocoded devices when fetching new data
    geocodedDevices.current.clear();
    setDeviceAddresses({});
    setIsReverseGeocoding({});
    await Promise.all([
      fetchDevices(), 
      fetchMachines(), 
      fetchUnlinkedDevices(), 
      fetchUnlinkedMachines()
    ]);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchData()
  }, [isAuthenticated, accessToken])

  // Reverse geocoding function for device locations
  const reverseGeocode = useCallback(async (deviceId: string, lat: number, lng: number) => {
    setIsReverseGeocoding(prev => ({ ...prev, [deviceId]: true }))
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      if (data && data.display_name) {
        setDeviceAddresses(prev => ({ ...prev, [deviceId]: data.display_name }))
      } else {
        setDeviceAddresses(prev => ({ ...prev, [deviceId]: "Address not found" }))
      }
      // Mark as geocoded
      geocodedDevices.current.add(deviceId)
    } catch (error) {
      console.error("Error during reverse geocoding:", error)
      setDeviceAddresses(prev => ({ ...prev, [deviceId]: "Error fetching address" }))
      // Mark as geocoded even if failed to avoid retry
      geocodedDevices.current.add(deviceId)
    } finally {
      setIsReverseGeocoding(prev => ({ ...prev, [deviceId]: false }))
    }
  }, [])


  // Handle device-machine linking
  const handleLink = async () => {
    if (!selectedDevice || !selectedMachine || !accessToken) return

    setIsLinking(true)
    try {
      // Link device to machine using device ID and machine ID
      await devicesApi.linkToMachine(accessToken, selectedDevice, {
        machine_id: selectedMachine
      })

      // Refresh data
      await Promise.all([
        fetchDevices(),
        fetchUnlinkedDevices(),
        fetchUnlinkedMachines()
      ])
      
      setSelectedDevice(null)
      setSelectedMachine(null)
      toast({
        title: "Success",
        description: "Device linked to machine successfully",
      })
    } catch (err) {
      console.error('Failed to link device:', err)
      toast({
        title: "Error",
        description: "Failed to link device to machine",
        variant: "destructive",
      })
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async (deviceId: string) => {
    if (!accessToken) return

    setIsUnlinking(deviceId);
    try {
      // Unlink device from machine using dedicated API
      await devicesApi.unlinkFromMachine(accessToken, deviceId)

      // Refresh data
      await Promise.all([
        fetchDevices(),
        fetchUnlinkedDevices(),
        fetchUnlinkedMachines()
      ]);
      
      toast({
        title: "Success",
        description: "Device unlinked from machine successfully",
      })
    } catch (err) {
      console.error('Failed to unlink device:', err)
      toast({
        title: "Error",
        description: "Failed to unlink device from machine",
        variant: "destructive",
      })
    } finally {
      setIsUnlinking(null)
    }
  }

  // Use pre-filtered data from API with memoization
  const linkedDevices = useMemo(() => 
    devices.filter((d) => d.machine_id), 
    [devices]
  );

  // Reverse geocode device locations when devices are loaded
  useEffect(() => {
    linkedDevices.forEach(device => {
      if (device.latest_location?.latitude && device.latest_location?.longitude) {
        // Only geocode if we haven't already done it
        if (!geocodedDevices.current.has(device.device_id) && !isReverseGeocoding[device.device_id]) {
          reverseGeocode(device.device_id, device.latest_location.latitude, device.latest_location.longitude)
        }
      }
    })
  }, [linkedDevices, reverseGeocode, isReverseGeocoding])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading devices and machines...</p>
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
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Device Mapping</h1>
          <p className="text-muted-foreground mt-1">Link devices to machines (1-to-1 relationship)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Linked Devices and Machines */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle>Linked Devices & Machines</CardTitle>
              <CardDescription>Active device-machine connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {linkedDevices.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No linked pairs yet</p>
                ) : (
                  linkedDevices.map((device) => {
                    const linkedMachine = machines.find((m) => m.machine_id === device.machine_id)
                    return (
                      <div
                        key={device.device_id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{device.model}</p>
                          <p className="text-xs text-muted-foreground">ID: {device.device_id}</p>
                          <div className="mt-1">
                            {isReverseGeocoding[device.device_id] ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Fetching location...</span>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                📍 {deviceAddresses[device.device_id] || "Location not available"}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="px-3 text-muted-foreground">↔</div>
                        <div className="flex-1 text-right">
                          <p className="font-medium text-foreground">
                            {linkedMachine?.name || 'Unknown Machine'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {linkedMachine?.address || 'Unknown Location'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlink(device.device_id)}
                          disabled={isUnlinking === device.device_id}
                          className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {isUnlinking === device.device_id ? 'Unlinking...' : 'Unlink'}
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linking Panel */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Create Link</CardTitle>
              <CardDescription>Link unassigned devices to machines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Select Device</label>
                <select
                  value={selectedDevice || ""}
                  onChange={(e) => setSelectedDevice(e.target.value || null)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground text-sm"
                >
                  <option value="">Choose a device...</option>
                  {unlinkedDevices.map((device) => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.model} (ID: {device.device_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Select Machine</label>
                <select
                  value={selectedMachine || ""}
                  onChange={(e) => setSelectedMachine(e.target.value || null)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground text-sm"
                >
                  <option value="">Choose a machine...</option>
                  {unlinkedMachines.map((machine) => (
                    <option key={machine.machine_id} value={machine.machine_id}>
                      {machine.name} ({machine.address})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleLink}
                disabled={!selectedDevice || !selectedMachine || isLinking}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              >
                {isLinking ? 'Linking...' : 'Link Device to Machine'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Unlinked Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Unlinked Devices</CardTitle>
              <CardDescription>{unlinkedDevices.length} devices waiting to be linked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unlinkedDevices.length === 0 ? (
                  <p className="text-muted-foreground text-sm">All devices are linked</p>
                ) : (
                  unlinkedDevices.map((device) => (
                    <div key={device.device_id} className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium text-foreground">{device.model}</p>
                      <p className="text-xs text-muted-foreground">ID: {device.device_id}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Unlinked Machines</CardTitle>
              <CardDescription>{unlinkedMachines.length} machines waiting to be linked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unlinkedMachines.length === 0 ? (
                  <p className="text-muted-foreground text-sm">All machines are linked</p>
                ) : (
                  unlinkedMachines.map((machine) => (
                    <div key={machine.machine_id} className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium text-foreground">{machine.name}</p>
                      <p className="text-xs text-muted-foreground">{machine.address}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
