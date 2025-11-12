"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/auth-store"
import { machinesApi } from "@/lib/api/machines"
import { locationsApi } from "@/lib/api/locations"
import { Machine } from "@/lib/api/machines/types"
import { Country, City } from "@/lib/api/locations/types"

// Dynamic import for MachinesMap to avoid SSR issues with Leaflet
const MachinesMap = dynamic(() => import("@/components/machines-map").then(mod => ({ default: mod.MachinesMap })), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>
})
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, MapPin, X, Search, Target } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export default function RadiusFilterPage() {
  const { toast } = useToast()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [machines, setMachines] = useState<Machine[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<Record<string, City[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [countryCode, setCountryCode] = useState<string>("")
  const [cityCode, setCityCode] = useState<string>("")
  const [centerPoint, setCenterPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState<string>("5")
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [showList, setShowList] = useState(false)

  const fetchMachinesByRadius = async () => {
    if (!isAuthenticated || !accessToken || !centerPoint || !countryCode || !cityCode) {
      if (!centerPoint) {
        toast({
          title: "No Location Selected",
          description: "Please click on the map to select a location first",
          variant: "destructive",
        })
      }
      return
    }

    const radiusNum = parseFloat(radiusKm)
    if (isNaN(radiusNum) || radiusNum <= 0) {
      toast({
        title: "Invalid Radius",
        description: "Please enter a valid radius greater than 0",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await machinesApi.filterMachinesByRadius(
        accessToken,
        countryCode,
        cityCode,
        centerPoint.lat,
        centerPoint.lng,
        radiusNum
      )
      setMachines(response.data || [])
    } catch (error: any) {
      console.error("Error fetching machines by radius:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch machines by radius",
        variant: "destructive",
      })
      setMachines([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch locations (countries and cities)
  const fetchLocations = async () => {
    if (!isAuthenticated || !accessToken) {
      setIsLoadingLocations(false)
      return
    }

    try {
      setIsLoadingLocations(true)
      
      // Fetch all countries
      const countriesResponse = await locationsApi.getCountries(accessToken)
      const countriesData = countriesResponse.data || []
      setCountries(countriesData)

      // Set default country if available
      if (countriesData.length > 0 && !countryCode) {
        setCountryCode(countriesData[0].country_code)
      }

      // Fetch cities for each country
      const citiesMap: Record<string, City[]> = {}
      for (const country of countriesData) {
        try {
          const citiesResponse = await locationsApi.getCities(accessToken, country.country_code)
          citiesMap[country.country_code] = citiesResponse.data || []
        } catch (error) {
          console.error(`Error fetching cities for ${country.country_code}:`, error)
          citiesMap[country.country_code] = []
        }
      }
      setCities(citiesMap)

      // Set default city for default country
      if (countriesData.length > 0 && !cityCode) {
        const defaultCountryCode = countriesData[0].country_code
        const defaultCities = citiesMap[defaultCountryCode] || []
        if (defaultCities.length > 0) {
          setCityCode(defaultCities[0].city_code)
        }
      }
    } catch (error: any) {
      console.error("Error fetching locations:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch locations",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLocations(false)
    }
  }

  useEffect(() => {
    fetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isAuthenticated])

  // Fetch cities when country changes
  useEffect(() => {
    if (countryCode && accessToken && isAuthenticated) {
      const fetchCitiesForCountry = async () => {
        try {
          const citiesResponse = await locationsApi.getCities(accessToken, countryCode)
          setCities(prev => ({
            ...prev,
            [countryCode]: citiesResponse.data || []
          }))
          
          // Set first city as default if cityCode is empty
          const newCities = citiesResponse.data || []
          if (newCities.length > 0 && !cityCode) {
            setCityCode(newCities[0].city_code)
          } else if (newCities.length === 0) {
            setCityCode("")
          }
        } catch (error) {
          console.error(`Error fetching cities for ${countryCode}:`, error)
        }
      }
      fetchCitiesForCountry()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, accessToken, isAuthenticated])

  const handleClearFilters = () => {
    // Reset to first country and city if available
    if (countries.length > 0) {
      const firstCountry = countries[0]
      setCountryCode(firstCountry.country_code)
      const firstCities = cities[firstCountry.country_code] || []
      setCityCode(firstCities.length > 0 ? firstCities[0].city_code : "")
    } else {
      setCountryCode("")
      setCityCode("")
    }
    setCenterPoint(null)
    setRadiusKm("5")
    setMachines([])
  }

  const availableCities = countryCode ? cities[countryCode] || [] : []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Radius Filter</h1>
            <p className="text-muted-foreground mt-1">
              Filter machines by location and radius. Select a point on the map and specify the radius in kilometers.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        </div>

        {/* Filter Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Radius Filter
            </CardTitle>
            <CardDescription>
              Select country, city, click on map to choose location, then enter radius to find machines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Country and City Selection */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Country *</label>
                  <div className="relative">
                    <Select value={countryCode || undefined} onValueChange={(value) => {
                      setCountryCode(value)
                      // Clear city when country changes
                      if (value !== countryCode) {
                        setCityCode("")
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    <SelectContent>
                      {isLoadingLocations ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        countries.map((country) => (
                          <SelectItem key={country.country_code} value={country.country_code}>
                            {country.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                    </Select>
                    {countryCode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-8 top-0 h-full px-2 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCountryCode("")
                          setCityCode("")
                        }}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">City *</label>
                  <div className="relative">
                    <Select
                      value={cityCode || undefined}
                      onValueChange={setCityCode}
                      disabled={!countryCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={countryCode ? "Select city" : "Select country first"} />
                      </SelectTrigger>
                    <SelectContent>
                      {isLoadingLocations ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : availableCities.length > 0 ? (
                        availableCities.map((city) => (
                          <SelectItem key={city.city_code} value={city.city_code}>
                            {city.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-cities" disabled>No cities available</SelectItem>
                      )}
                    </SelectContent>
                    </Select>
                    {cityCode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-8 top-0 h-full px-2 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCityCode("")
                        }}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Radius Input Section */}
              <div className="pt-4 border-t border-border">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="radiusKm" className="text-sm font-medium mb-2 block">
                      Radius (KM) *
                    </Label>
                    <Input
                      id="radiusKm"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(e.target.value)}
                      placeholder="Enter radius in km (e.g., 5)"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={fetchMachinesByRadius}
                      disabled={!centerPoint || !countryCode || !cityCode || isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {centerPoint && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <Target className="h-4 w-4 inline mr-1" />
                    Selected location: {centerPoint.lat.toFixed(6)}, {centerPoint.lng.toFixed(6)}
                  </div>
                )}
                {machines.length > 0 && (
                  <div className="mt-3 text-sm font-medium text-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
                    Found {machines.length} machine{machines.length !== 1 ? "s" : ""} within {radiusKm} km radius
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  * Click on the map below to select a location, then enter radius and click Search
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Machines Map */}
        {countryCode && cityCode && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Machines Location Map</CardTitle>
              <CardDescription>
                Click on the map to select a location. Green markers indicate active machines, red markers indicate inactive ones.
                {centerPoint && ` Blue marker shows your selected location with ${radiusKm} km radius circle.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[600px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Searching machines...</p>
                  </div>
                </div>
              ) : (
                <MachinesMap 
                  machines={machines} 
                  height="600px"
                  onMachineSelect={setSelectedMachine}
                  onLocationSelect={(lat, lng) => {
                    setCenterPoint({ lat, lng })
                  }}
                  centerPoint={centerPoint}
                  radiusKm={centerPoint ? parseFloat(radiusKm) || undefined : undefined}
                  selectable={true}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected Machine Details */}
        {selectedMachine && (
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Machine Details</CardTitle>
                  <CardDescription>Information about the selected machine</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMachine(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{selectedMachine.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedMachine.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedMachine.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Machine ID</p>
                    <p className="text-sm text-foreground">{selectedMachine.machine_id}</p>
                  </div>
                  {selectedMachine.device_id && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Device ID</p>
                      <p className="text-sm text-foreground">{selectedMachine.device_id}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                    <p className="text-sm text-foreground flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {selectedMachine.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                    <p className="text-sm text-foreground">
                      {(selectedMachine.device?.latitude ?? selectedMachine.lat).toFixed(6)}, {" "}
                      {(selectedMachine.device?.longitude ?? selectedMachine.lng).toFixed(6)}
                    </p>
                  </div>
                  {selectedMachine.radius && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Radius</p>
                      <p className="text-sm text-foreground">{selectedMachine.radius}m</p>
                    </div>
                  )}
                  {selectedMachine.created_at && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Created At</p>
                      <p className="text-sm text-foreground">
                        {new Date(selectedMachine.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Machines List */}
        {machines.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Found Machines ({machines.length})</CardTitle>
                  <CardDescription>List of machines within the selected radius</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowList(!showList)}
                >
                  {showList ? "Hide List" : "Show List"}
                </Button>
              </div>
            </CardHeader>
            {showList && (
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {machines.map((machine) => {
                    const lat = machine.device?.latitude ?? machine.lat
                    const lng = machine.device?.longitude ?? machine.lng
                    const isActive = machine.status === "active"

                    return (
                      <div
                        key={machine.machine_id}
                        className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedMachine(machine)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{machine.name}</h3>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {machine.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">ID: {machine.machine_id}</p>
                          <p className="text-sm text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {machine.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Location: {lat.toFixed(6)}, {lng.toFixed(6)}
                            {machine.radius && ` • Radius: ${machine.radius}m`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

