"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/lib/auth-store"
import { locationsApi, CreateLocationRequest, UpdateLocationRequest } from "@/lib/api/locations"
import { Location, Country, City } from "@/lib/api/locations/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Plus, Edit, Trash2, MapPin, Globe, Building2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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

export default function LocationsPage() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  
  // State for data
  const [locations, setLocations] = useState<Location[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<Record<string, City[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [selectedCity, setSelectedCity] = useState<string>("all")
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isCountry, setIsCountry] = useState(true) // true for country, false for city
  
  // Form states
  const [formData, setFormData] = useState<CreateLocationRequest>({
    country_code: "",
    city_code: undefined,
    name: "",
    is_active: true,
  })

  // Fetch all locations
  const fetchLocations = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await locationsApi.getAllLocations(accessToken)
      const allLocations = response.data || []
      setLocations(allLocations)
      
      // Separate countries and cities
      const countriesData = allLocations.filter(loc => loc.city_code === '#') as Country[]
      const citiesData: Record<string, City[]> = {}
      
      allLocations.forEach(loc => {
        if (loc.city_code !== '#') {
          const city = loc as City
          if (!citiesData[city.country_code]) {
            citiesData[city.country_code] = []
          }
          citiesData[city.country_code].push(city)
        }
      })
      
      setCountries(countriesData)
      setCities(citiesData)
    } catch (err: any) {
      console.error('Failed to load locations:', err)
      setError('Failed to load locations')
      toast({
        title: "Error",
        description: err.message || "Failed to load locations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, accessToken, toast])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  // Filter locations
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.country_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.city_code && loc.city_code !== '#' && loc.city_code.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCountry = selectedCountry === "all" || loc.country_code === selectedCountry
    
    // City filter logic
    let matchesCity = true
    if (selectedCountry !== "all") {
      // When a country is selected
      if (selectedCity === "all") {
        // Show all locations in that country (country + all cities)
        matchesCity = true
      } else if (selectedCity === "countries") {
        // Show only the country itself
        matchesCity = loc.city_code === '#'
      } else {
        // Show specific city
        matchesCity = loc.city_code === selectedCity
      }
    }
    // When no country selected, show everything (matchesCity = true)
    
    return matchesSearch && matchesCountry && matchesCity
  })

  // Get available cities for selected country
  const availableCities = selectedCountry !== "all" ? cities[selectedCountry] || [] : []

  // Handle country change - reset city filter
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode)
    setSelectedCity("all")
  }

  const handleCreate = async () => {
    if (!accessToken || !formData.name || !formData.country_code) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const data: CreateLocationRequest = {
        country_code: formData.country_code,
        city_code: isCountry ? '#' : formData.city_code,
        name: formData.name,
        is_active: formData.is_active ?? true,
      }
      
      await locationsApi.createLocation(accessToken, data)
      toast({
        title: "Success",
        description: `${isCountry ? 'Country' : 'City'} created successfully`,
      })
      setIsCreateModalOpen(false)
      resetForm()
      fetchLocations()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create location",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!accessToken || !selectedLocation || !formData.name) {
      return
    }

    try {
      const data: UpdateLocationRequest = {
        name: formData.name,
        is_active: formData.is_active,
      }
      
      const isCountryLocation = selectedLocation.city_code === '#'
      await locationsApi.updateLocation(
        accessToken,
        selectedLocation.country_code,
        isCountryLocation ? undefined : selectedLocation.city_code,
        data
      )
      toast({
        title: "Success",
        description: `${isCountryLocation ? 'Country' : 'City'} updated successfully`,
      })
      setIsEditModalOpen(false)
      resetForm()
      fetchLocations()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update location",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!accessToken || !selectedLocation) {
      return
    }

    try {
      const isCountryLocation = selectedLocation.city_code === '#'
      await locationsApi.deleteLocation(
        accessToken,
        selectedLocation.country_code,
        isCountryLocation ? undefined : selectedLocation.city_code
      )
      toast({
        title: "Success",
        description: `${isCountryLocation ? 'Country' : 'City'} deleted successfully`,
      })
      setIsDeleteModalOpen(false)
      setSelectedLocation(null)
      fetchLocations()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete location",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      country_code: "",
      city_code: undefined,
      name: "",
      is_active: true,
    })
    setIsCountry(true)
  }

  const openCreateModal = (isCountryType: boolean) => {
    setIsCountry(isCountryType)
    resetForm()
    setIsCreateModalOpen(true)
  }

  const openEditModal = (location: Location) => {
    setSelectedLocation(location)
    setIsCountry(location.city_code === '#')
    setFormData({
      country_code: location.country_code,
      city_code: location.city_code === '#' ? undefined : location.city_code,
      name: location.name,
      is_active: location.is_active,
    })
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (location: Location) => {
    setSelectedLocation(location)
    setIsDeleteModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
            <p className="text-muted-foreground">
              Manage countries and cities for machine filtering
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Country
            </Button>
            <Button onClick={() => openCreateModal(false)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add City
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, country code, or city code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={selectedCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Countries</option>
                  {countries.map((country) => (
                    <option key={country.country_code} value={country.country_code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCountry !== "all" && (
                <div className="w-full sm:w-48">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Locations</option>
                    <option value="countries">Countries Only</option>
                    {availableCities.map((city) => (
                      <option key={city.city_code} value={city.city_code}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Locations</CardTitle>
            <CardDescription>
              {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">{error}</div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No locations found
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Country Code</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">City Code</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Created</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.map((location) => {
                      const isCountryLocation = location.city_code === '#'
                      return (
                        <tr key={`${location.country_code}-${location.city_code}`} className="border-b">
                          <td className="p-4 align-middle">
                            {isCountryLocation ? (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <Globe className="h-3 w-3" />
                                Country
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <Building2 className="h-3 w-3" />
                                City
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 align-middle font-medium">{location.name}</td>
                          <td className="p-4 align-middle">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {location.country_code}
                            </code>
                          </td>
                          <td className="p-4 align-middle">
                            {isCountryLocation ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {location.city_code}
                              </code>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            <Badge
                              variant={location.is_active ? "default" : "secondary"}
                            >
                              {location.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-sm text-muted-foreground">
                            {formatDate(location.created_at)}
                          </td>
                          <td className="p-4 align-middle text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(location)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(location)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create {isCountry ? 'Country' : 'City'}</DialogTitle>
              <DialogDescription>
                Add a new {isCountry ? 'country' : 'city'} to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="country_code">Country Code *</Label>
                <Input
                  id="country_code"
                  placeholder="e.g., vn, us, th"
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                />
              </div>
              {!isCountry && (
                <div className="space-y-2">
                  <Label htmlFor="city_code">City Code *</Label>
                  <Input
                    id="city_code"
                    placeholder="e.g., hcm, hanoi, bangkok"
                    value={formData.city_code || ""}
                    onChange={(e) => setFormData({ ...formData, city_code: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder={`e.g., ${isCountry ? 'Vietnam' : 'Ho Chi Minh City'}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {isCountry ? 'Country' : 'City'}</DialogTitle>
              <DialogDescription>
                Update {isCountry ? 'country' : 'city'} information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Name *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit_is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedLocation?.name} ({selectedLocation?.city_code === '#' ? 'Country' : 'City'}).
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}

