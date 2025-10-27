"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPicker } from "@/components/ui/map-picker"
import { DashboardLayout } from "@/components/dashboard-layout"
import { machinesApi } from "@/lib/api/machines"
import { useAuthStore } from "@/lib/auth-store"
import { ArrowLeft, Save, X, MapPin, Loader2, Map } from "lucide-react"

export default function CreateMachinePage() {
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)

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

      // Cải thiện địa chỉ để tăng khả năng tìm thấy
      const improvedAddress = address
        .replace(/\bdistrict\b/gi, '') // Remove "district" 
        .replace(/\bward\b/gi, '') // Remove "ward"
        .replace(/\bstreet\b/gi, '') // Remove "street"
        .replace(/\broad\b/gi, '') // Remove "road"
        .replace(/\bavenue\b/gi, '') // Remove "avenue"
        .trim()

      // Thử nhiều cách tìm kiếm
      const searchQueries = [
        `${improvedAddress}, Ho Chi Minh City, Vietnam`,
        `${address}, Ho Chi Minh City, Vietnam`,
        `${improvedAddress}, Vietnam`,
        address
      ]

      let found = false
      for (const query of searchQueries) {
        try {
          console.log(`🔍 Searching for: ${query}`)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn&addressdetails=1`
          );
          
          if (!response.ok) {
            continue;
          };

          const data = await response.json();
          
          if (data && data.length > 0) {
            const { lat, lon, display_name } = data[0];
            console.log(`✅ Found coordinates for: ${display_name}`);
            setFormData(prev => ({
              ...prev,
              lat: lat,
              lng: lon
            }))
            found = true;
            break;
          }
        } catch (err) {
          console.log(`❌ Search failed for: ${query}`, err);
          continue;
        }
      }

      if (!found) {
        setError('Address not found. Please try a more specific address or include "Ho Chi Minh City" in the address.')
        setFormData(prev => ({
          ...prev,
          lat: "",
          lng: ""
        }));
      };
    } catch (err) {
      console.error('Geocoding error:', err)
      setError('Failed to get coordinates. Please check your internet connection and try again.')
      setFormData(prev => ({
        ...prev,
        lat: "",
        lng: ""
      }));
    } finally {
      setIsGeocoding(false);
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
        address: formData.address,
        status: 'offline' as const,
        last_known_lat: lat,
        last_known_lng: lng
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

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedLocation({ lat, lng, address })
    setFormData(prev => ({
      ...prev,
      lat: lat.toString(),
      lng: lng.toString(),
      address: address
    }))
    setShowMapModal(false)
    setError(null)
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-destructive">
                      <X className="h-4 w-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    {error.includes('Address not found') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => geocodeAddress(formData.address)}
                        disabled={isGeocoding}
                        className="text-xs"
                      >
                        {isGeocoding ? 'Searching...' : 'Try Again'}
                      </Button>
                    )}
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g., 778 Xo Viet Nghe Tinh, Binh Thanh, Ho Chi Minh City"
                      required
                    />
                    {isGeocoding && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3"
                        onClick={() => setShowMapModal(true)}
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
                        onLocationSelect={handleLocationSelect}
                        onClose={() => setShowMapModal(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Type address or click the map icon to select location
                  </p>
                  <p className="text-xs text-blue-600">
                    💡 Tip: Use the map for more accurate location selection
                  </p>
                </div>
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
                  <Label htmlFor="radius">Allowed Radius (meters) *</Label>
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
