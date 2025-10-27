"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { devicesApi } from "@/lib/api/devices"
import { useAuthStore } from "@/lib/auth-store"
import { Device } from "@/lib/api/devices/types"
import { ArrowLeft, Wifi, Clock, Activity, Calendar, MapPin, Loader2 } from "lucide-react"

export default function DeviceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [device, setDevice] = useState<Device | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const deviceId = params.id as string

  const fetchDevice = async () => {
    if (!isAuthenticated || !accessToken || !deviceId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await devicesApi.getDevice(accessToken, deviceId)
      console.log("Device response:", response)
      setDevice(response.data)
    } catch (err) {
      setError('Failed to load device details')
      console.error('Error fetching device:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDevice()
  }, [isAuthenticated, accessToken, deviceId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-700 border-green-200"
      case 'inactive':
        return "bg-red-100 text-red-700 border-red-200"
      case 'maintenance':
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case 'offline':
        return "bg-gray-100 text-gray-700 border-gray-200"
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

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return "Never"
    
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
            <h1 className="text-3xl font-bold text-foreground">Device Details</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchDevice} variant="outline">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!device) {
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
            <h1 className="text-3xl font-bold text-foreground">Device Details</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-muted-foreground">Device not found</p>
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
                <Wifi className="h-8 w-8" />
                {device.device_id}
              </h1>
              <p className="text-muted-foreground mt-1">Model: {device.model}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                  <p className="text-foreground font-mono text-sm">{device.device_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Model</label>
                  <p className="text-foreground font-medium">{device.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Machine ID</label>
                  <p className="text-foreground font-mono text-sm">
                    {device.machine_id || "Not linked"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(device.status)}>
                      {device.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Seen</label>
                  <p className="text-foreground text-sm">{formatLastSeen(device.latest_location?.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Linked Time</label>
                  <p className="text-foreground text-sm">
                    {device.linked_time ? formatDate(device.linked_time) : "Not linked"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          {device.latest_location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Latest Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Coordinates</label>
                  <p className="text-foreground text-sm font-mono">
                    {device.latest_location.latitude.toFixed(6)}, {device.latest_location.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Accuracy</label>
                  <p className="text-foreground text-sm">{device.latest_location.accuracy}m</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <p className="text-foreground text-sm capitalize">{device.latest_location.source}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                  <p className="text-foreground text-sm">{formatDate(device.latest_location.timestamp)}</p>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <p className="text-foreground font-mono text-sm">{device.tenant_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-foreground text-sm">{formatDate(device.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="text-foreground text-sm">{formatDate(device.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    device.status === 'active' ? 'bg-green-500' : 
                    device.status === 'inactive' ? 'bg-red-500' :
                    device.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-lg font-medium">{device.status.toUpperCase()}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {device.status === 'active' && 'Device is online and functioning normally'}
                  {device.status === 'inactive' && 'Device is offline or not responding'}
                  {device.status === 'maintenance' && 'Device is under maintenance'}
                  {device.status === 'offline' && 'Device is not connected to the network'}
                </p>
                <div className="text-xs text-muted-foreground">
                  Last seen: {formatLastSeen(device.latest_location?.timestamp)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
