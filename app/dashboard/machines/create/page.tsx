"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardLayout } from "@/components/dashboard-layout"
import { machinesApi } from "@/lib/api/machines"
import { useAuthStore } from "@/lib/auth-store"
import { ArrowLeft, Save, X, MapPin, Loader2 } from "lucide-react"

export default function CreateMachinePage() {
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    machine_id: "",
    name: "",
    lat: "",
    lng: "",
    radius: "",
    address: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) {
      setFormData(prev => ({
        ...prev,
        lat: "",
        lng: ""
      }))
      return
    }

    try {
      setIsGeocoding(true)
      setError(null)

      // Sử dụng Nominatim (OpenStreetMap) API miễn phí
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      
      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setFormData(prev => ({
          ...prev,
          lat: lat,
          lng: lon
        }))
      } else {
        setError('Address not found. Please check the address and try again.')
        setFormData(prev => ({
          ...prev,
          lat: "",
          lng: ""
        }))
      }
    } catch (err) {
      console.error('Geocoding error:', err)
      setError('Failed to get coordinates. Please check the address and try again.')
      setFormData(prev => ({
        ...prev,
        lat: "",
        lng: ""
      }))
    } finally {
      setIsGeocoding(false)
    }
  }

  // Debounced geocoding
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.address.trim()) {
        geocodeAddress(formData.address)
      }
    }, 1000) // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId)
  }, [formData.address])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated || !accessToken) {
      setError('Not authenticated')
      return
    }

    // Validation
    if (!formData.machine_id || !formData.name || !formData.radius || !formData.address) {
      setError('All required fields must be filled')
      return
    }

    // Check if coordinates are available
    if (!formData.lat || !formData.lng) {
      setError('Please wait for coordinates to be calculated from the address')
      return
    }

    // Validate coordinates
    const lat = parseFloat(formData.lat)
    const lng = parseFloat(formData.lng)
    const radius = parseFloat(formData.radius)

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      setError('Invalid coordinates or radius')
      return
    }

    if (radius <= 0) {
      setError('Radius must be greater than 0')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const createData = {
        machine_id: formData.machine_id,
        name: formData.name,
        lat: lat,
        lng: lng,
        radius: radius,
        address: formData.address
      }

      console.log("Creating machine with data:", createData)
      await machinesApi.createMachine(accessToken, createData)
      
      // Redirect to machines list
      router.push('/dashboard/machines')
    } catch (err) {
      setError('Failed to create machine')
      console.error('Error creating machine:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/machines')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Machine</h1>
            <p className="text-muted-foreground mt-1">Add a new coffee machine to your fleet</p>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl">
          <CardHeader className="pb-4">
            <CardTitle>Machine Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <X className="h-4 w-4" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-destructive text-sm mt-1">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="machine_id">Machine ID *</Label>
                  <Input
                    id="machine_id"
                    name="machine_id"
                    value={formData.machine_id}
                    onChange={handleInputChange}
                    placeholder="e.g., KOFIX-MACHINE-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Machine Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., NIN-JA"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <div className="relative">
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g., 123 Nguyen Hue, District 1, Ho Chi Minh City"
                    required
                  />
                  {isGeocoding && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Coordinates will be automatically calculated from the address
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <div className="relative">
                    <Input
                      id="lat"
                      name="lat"
                      type="text"
                      value={formData.lat}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Auto-calculated"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <div className="relative">
                    <Input
                      id="lng"
                      name="lng"
                      type="text"
                      value={formData.lng}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Auto-calculated"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="radius">Radius (meters) *</Label>
                  <Input
                    id="radius"
                    name="radius"
                    type="number"
                    min="1"
                    value={formData.radius}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Creating...' : 'Create Machine'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
