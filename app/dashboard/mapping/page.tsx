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
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Country, City } from "@/lib/api/locations/types"

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

  // State for filtering
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [countryFilter, setCountryFilter] = useState<string>("")
  const [cityFilter, setCityFilter] = useState<string>("")
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<Record<string, City[]>>({})

  // Fetch data from API
  const fetchDevices = async () => {
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false)
      return
    }

    try {
      // Fetch all devices with pagination (max limit is 100)
      let allDevices: Device[] = []
      let skip = 0
      const limit = 100
      let hasMore = true

      while (hasMore) {
        const response = await devicesApi.getAllDevices(accessToken, { limit, skip })
        allDevices = [...allDevices, ...response.data]
        
        // Check if there are more devices to fetch
        hasMore = response.pagination.hasNext
        skip += limit
      }

      setDevices(allDevices)
    } catch (err) {
      console.error('Failed to load devices:', err)
      setError('Failed to load devices')
    }
  }

  const fetchMachines = async () => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    try {
      // Fetch all machines with pagination (max limit is 100)
      let allMachines: Machine[] = []
      let skip = 0
      const limit = 100
      let hasMore = true

      while (hasMore) {
        const response = await machinesApi.getMachines(accessToken, { limit, skip })
        allMachines = [...allMachines, ...response.data]
        
        // Check if there are more machines to fetch
        hasMore = response.pagination.hasNext
        skip += limit
      }

      setMachines(allMachines)
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
      // Link machine to device using machines API
      await machinesApi.linkMachineToDevice(accessToken, selectedMachine, selectedDevice)

      // Refresh data
      await Promise.all([
        fetchDevices(),
        fetchMachines(),
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

    // Find the machine linked to this device
    const device = devices.find(d => d.device_id === deviceId)
    if (!device || !device.machine_id) {
      toast({
        title: "Error",
        description: "Device is not linked to any machine",
        variant: "destructive",
      })
      return
    }

    setIsUnlinking(deviceId);
    try {
      // Unlink machine from device using machines API
      await machinesApi.unlinkMachineFromDevice(accessToken, device.machine_id)

      // Refresh data
      await Promise.all([
        fetchDevices(),
        fetchMachines(),
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

  // Extract countries and cities from devices data
  const extractCountriesAndCities = useCallback((devicesData: Device[]) => {
    interface CountryInfo {
      country_code: string;
      name: string;
    }
    interface CityInfo {
      city_code: string;
      name: string;
      country_code: string;
    }

    const countriesMap: Record<string, CountryInfo> = {}
    const citiesMap: Record<string, Record<string, CityInfo>> = {}

    devicesData.forEach(device => {
      if (device.country) {
        const countryCode = device.country.toLowerCase()
        if (!countriesMap[countryCode]) {
          countriesMap[countryCode] = {
            country_code: countryCode,
            name: countryCode.toUpperCase()
          }
        }

        if (device.city) {
          const cityCode = device.city.toLowerCase()
          if (!citiesMap[countryCode]) {
            citiesMap[countryCode] = {}
          }
          if (!citiesMap[countryCode][cityCode]) {
            citiesMap[countryCode][cityCode] = {
              city_code: cityCode,
              name: cityCode.toUpperCase(),
              country_code: countryCode
            }
          }
        }
      }
    })

    // Convert to arrays
    const countriesData: Country[] = Object.values(countriesMap).map((country) => ({
      country_code: country.country_code,
      city_code: '#' as const,
      name: country.name,
      is_active: true,
      created_at: new Date().toISOString()
    }))

    const citiesData: Record<string, City[]> = {}
    Object.keys(citiesMap).forEach(countryCode => {
      const countryCities = citiesMap[countryCode]
      citiesData[countryCode] = Object.values(countryCities).map((city) => ({
        country_code: city.country_code,
        city_code: city.city_code,
        name: city.name,
        is_active: true,
        created_at: new Date().toISOString()
      }))
    })

    setCountries(countriesData)
    setCities(citiesData)
  }, [])

  // Extract countries and cities when devices are loaded
  useEffect(() => {
    if (devices.length > 0) {
      extractCountriesAndCities(devices)
    }
  }, [devices, extractCountriesAndCities])

  // Use pre-filtered data from API with memoization and apply filters
  const linkedDevices = useMemo(() => {
    let filtered = devices.filter((d) => d.machine_id)

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(device => {
        const linkedMachine = machines.find((m) => m.machine_id === device.machine_id)
        return (
          device.device_id.toLowerCase().includes(searchLower) ||
          device.model?.toLowerCase().includes(searchLower) ||
          linkedMachine?.name.toLowerCase().includes(searchLower) ||
          linkedMachine?.address.toLowerCase().includes(searchLower)
        )
      })
    }

    // Apply country filter
    if (countryFilter) {
      filtered = filtered.filter(device => 
        device.country?.toLowerCase() === countryFilter.toLowerCase()
      )
    }

    // Apply city filter
    if (cityFilter) {
      filtered = filtered.filter(device => 
        device.city?.toLowerCase() === cityFilter.toLowerCase()
      )
    }

    return filtered
  }, [devices, machines, searchTerm, countryFilter, cityFilter]);

  // Reverse geocode device locations when devices are loaded
  useEffect(() => {
    linkedDevices.forEach(device => {
      if (device.latitude != null && device.longitude != null) {
        // Only geocode if we haven't already done it
        if (!geocodedDevices.current.has(device.device_id) && !isReverseGeocoding[device.device_id]) {
          reverseGeocode(device.device_id, device.latitude, device.longitude)
        }
      }
    })
  }, [linkedDevices, reverseGeocode, isReverseGeocoding])

  // Filter handlers
  const handleSearch = () => {
    setSearchTerm(searchInput)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const availableCities = countryFilter && countryFilter !== "all" ? cities[countryFilter] || [] : []

  const handleCountryFilterChange = (value: string) => {
    setCountryFilter(value === "all" ? "" : value)
    setCityFilter("") // Reset city filter when country changes
  }

  const handleCityFilterChange = (value: string) => {
    setCityFilter(value === "all" ? "" : value)
  }

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
              <CardDescription>
                Active device-machine connections ({linkedDevices.length} linked)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter Section */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Input 
                    placeholder="Search by device ID, model, machine name, or address" 
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
                
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Filter by Country:</label>
                  <Select
                    value={countryFilter || "all"}
                    onValueChange={handleCountryFilterChange}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.country_code} value={country.country_code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label className="text-sm font-medium text-foreground">Filter by City:</label>
                  <Select
                    value={cityFilter || "all"}
                    onValueChange={handleCityFilterChange}
                    disabled={!countryFilter || countryFilter === "all"}
                  >
                    <SelectTrigger className="w-48" disabled={!countryFilter || countryFilter === "all"}>
                      <SelectValue placeholder={countryFilter && countryFilter !== "all" ? "Select city" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {availableCities.length > 0 ? (
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
                </div>
              </div>

              {/* Linked Devices List with Scroll */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {linkedDevices.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    {searchTerm || countryFilter || cityFilter 
                      ? "No linked pairs found matching your filters" 
                      : "No linked pairs yet"}
                  </p>
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
