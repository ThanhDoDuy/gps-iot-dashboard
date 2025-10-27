"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { machinesApi } from "@/lib/api/machines"
import { useAuthStore } from "@/lib/auth-store"
import { Machine } from "@/lib/api/machines/types"
import { ArrowLeft, MapPin, Clock, Activity, Calendar, Wifi, Map, Loader2 } from "lucide-react"

export default function MachineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastKnownAddress, setLastKnownAddress] = useState<string | null>(null)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)

  const machineId = params.id as string

  const fetchMachine = async () => {
    if (!isAuthenticated || !accessToken || !machineId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await machinesApi.getMachine(accessToken, machineId)
      console.log("Machine response:", response)
      setMachine(response.data)
    } catch (err) {
      setError('Failed to load machine details')
      console.error('Error fetching machine:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMachine()
  }, [isAuthenticated, accessToken, machineId])

  // Reverse geocoding for last known coordinates
  useEffect(() => {
    if (machine && machine.last_known_lat !== undefined && machine.last_known_lng !== undefined) {
      reverseGeocode(machine.last_known_lat, machine.last_known_lng)
    } else {
      setLastKnownAddress(null)
    }
  }, [machine])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-700 border-green-200"
      case 'inactive':
        return "bg-red-100 text-red-700 border-red-200"
      case 'maintenance':
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('EN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatCoordinates = (lat: number | undefined, lng: number | undefined) => {
    if (lat === undefined || lng === undefined) {
      return "N/A"
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180 // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  // Format distance for display
  const formatDistance = (distanceInMeters: number): string => {
    if (distanceInMeters >= 1000) {
      return `${(distanceInMeters / 1000).toFixed(2)} km`
    }
    return `${Math.round(distanceInMeters)} m`
  }

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      if (data && data.display_name) {
        setLastKnownAddress(data.display_name)
      } else {
        setLastKnownAddress("Address not found")
      }
    } catch (error) {
      console.error("Error during reverse geocoding:", error)
      setLastKnownAddress("Error fetching address")
    } finally {
      setIsReverseGeocoding(false)
    }
  }


  const openInNewTab = () => {
    if (!machine) return
    
    const currentLat = machine.lat
    const currentLng = machine.lng
    const lastLat = machine.last_known_lat || machine.lat
    const lastLng = machine.last_known_lng || machine.lng
    
    // Create a Google Maps URL that shows both locations
    const url = `https://www.google.com/maps/dir/${currentLat},${currentLng}/${lastLat},${lastLng}`
    window.open(url, '_blank')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Machine Details</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchMachine} variant="outline">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!machine) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Machine Details</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-muted-foreground">Machine not found</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Activity className="h-8 w-8" />
                {machine.name}
              </h1>
              <p className="text-muted-foreground mt-1">Machine ID: {machine.machine_id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Machine ID</label>
                  <p className="text-foreground font-mono text-sm">{machine.machine_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-foreground font-medium">{machine.name}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-foreground">{machine.address}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(machine.status)}>
                      {machine.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Origin Setup Address</label>
                <p className="text-foreground font-medium">{machine.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Known Address</label>
                {isReverseGeocoding ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Fetching address...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-foreground font-medium">
                      {lastKnownAddress || "N/A"}
                    </p>
                    {(!machine.last_known_lat || !machine.last_known_lng) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Same as origin setup coordinates
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Allowed Radius</label>
                  <p className="text-foreground">{machine.radius}m</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Far From Origin</label>
                  <p className="text-foreground">
                    {machine.last_known_lat !== undefined && machine.last_known_lng !== undefined
                      ? formatDistance(calculateDistance(machine.lat, machine.lng, machine.last_known_lat, machine.last_known_lng))
                      : "N/A"
                    }
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Location Check</label>
                <p className="text-foreground text-sm">{formatDate(machine.last_location_check)}</p>
              </div>
              
              {/* Compare Button */}
              <div className="pt-4 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={openInNewTab}
                >
                  <Map className="h-4 w-4" />
                  Compare Locations on Map
                </Button>
                
                <div className="text-xs text-muted-foreground text-center">
                  Opens Google Maps in new tab
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tenant ID</label>
                  <p className="text-foreground font-mono text-sm">{machine.tenant_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-foreground text-sm">{formatDate(machine.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="text-foreground text-sm">{formatDate(machine.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Linked Device
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {machine.device ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Device ID:</span>
                      <span className="font-mono text-sm">{machine.device.device_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Model:</span>
                      <span className="text-sm font-medium">{machine.device.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Update:</span>
                      <span className="text-sm">{formatDate(machine.last_location_check)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Device Status:</span>
                      <Badge 
                        variant={machine.device.status === 'active' ? 'default' : 'secondary'}
                        className={
                          machine.device.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : machine.device.status === 'inactive'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }
                      >
                        {machine.device.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">No device linked</p>
                  <p className="text-sm text-muted-foreground">
                    This machine is not connected to any tracking device
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => {
                      // TODO: Implement link device functionality
                      console.log("Link device to:", machine.machine_id)
                    }}
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    Link Device
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
