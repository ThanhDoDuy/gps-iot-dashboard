"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/auth-store"
import { machinesApi } from "@/lib/api/machines"
import { devicesApi } from "@/lib/api/devices"
import { locationsApi } from "@/lib/api/locations"
import { Machine } from "@/lib/api/machines/types"
import { Device } from "@/lib/api/devices/types"
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
import { Loader2, MapPin, Filter, X } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"


export default function DashboardPage() {
  const { toast } = useToast()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [machines, setMachines] = useState<Machine[]>([])
  const [allMachines, setAllMachines] = useState<Machine[]>([])
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<Record<string, City[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [countryCode, setCountryCode] = useState<string>("")
  const [cityCode, setCityCode] = useState<string>("")
  const [filteredCount, setFilteredCount] = useState(0)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [showList, setShowList] = useState(false)

  const fetchFilteredMachines = async () => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    // At least one filter must be provided
    if (!countryCode && !cityCode) {
      setMachines([])
      setFilteredCount(0)
      return
    }

    try {
      setIsLoading(true)
      const response = await machinesApi.filterMachinesByLocation(
        accessToken,
        countryCode || undefined,
        cityCode || undefined
      )
      console.log("Filter machines response:", response)
      setMachines(response.data || [])
      setFilteredCount(response.total || 0)
    } catch (error: any) {
      console.error("Error fetching filtered machines:", error)
      console.error("Error details:", {
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack
      })
      toast({
        title: "Error",
        description: error.message || "Failed to fetch machines",
        variant: "destructive",
      })
      setMachines([])
      setFilteredCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all machines and devices for stats
  const fetchAllData = async () => {
    if (!isAuthenticated || !accessToken) {
      setIsLoadingStats(false)
      return
    }

    try {
      setIsLoadingStats(true)
      
      // Fetch all machines
      const machinesResponse = await machinesApi.getMachines(accessToken)
      const machinesData = machinesResponse.data || []
      setAllMachines(machinesData)

      // Fetch all devices with pagination
      let allDevicesData: Device[] = []
      let skip = 0
      const limit = 100
      let hasMore = true

      while (hasMore) {
        const devicesResponse = await devicesApi.getAllDevices(accessToken, { limit, skip })
        allDevicesData = [...allDevicesData, ...devicesResponse.data]
        hasMore = devicesResponse.pagination.hasNext
        skip += limit
      }

      setAllDevices(allDevicesData)
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Fetch countries - only when dropdown is opened
  const fetchCountries = async () => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    // If already loaded, don't fetch again
    if (countries.length > 0) {
      return
    }

    try {
      setIsLoadingLocations(true)
      const countriesResponse = await locationsApi.getCountries(accessToken)
      const countriesData = countriesResponse.data || []
      console.log("Fetched countries:", countriesData)
      setCountries(countriesData)
    } catch (error: any) {
      console.error("Error fetching countries:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch countries",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLocations(false)
    }
  }

  // Fetch cities for a country - only when dropdown is opened
  const fetchCitiesForCountry = async (countryCodeToFetch: string) => {
    if (!isAuthenticated || !accessToken || !countryCodeToFetch) {
      return
    }

    // If already loaded for this country, don't fetch again
    if (cities[countryCodeToFetch] && cities[countryCodeToFetch].length > 0) {
      return
    }

    try {
      setIsLoadingLocations(true)
      const citiesResponse = await locationsApi.getCities(accessToken, countryCodeToFetch)
      const citiesData = citiesResponse.data || []
      setCities(prev => ({
        ...prev,
        [countryCodeToFetch]: citiesData
      }))
    } catch (error: any) {
      console.error(`Error fetching cities for ${countryCodeToFetch}:`, error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch cities",
        variant: "destructive",
      })
      setCities(prev => ({
        ...prev,
        [countryCodeToFetch]: []
      }))
    } finally {
      setIsLoadingLocations(false)
    }
  }

  useEffect(() => {
    fetchAllData()
    // Don't fetch locations on mount - only when dropdown is opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isAuthenticated])

  useEffect(() => {
    if (countryCode || cityCode) {
      fetchFilteredMachines()
    } else {
      setMachines([])
      setFilteredCount(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, cityCode, accessToken, isAuthenticated])

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
  }

  // Clear city when country changes
  useEffect(() => {
    if (countryCode) {
      setCityCode("")
    }
  }, [countryCode])

  const availableCities = countryCode ? cities[countryCode] || [] : []

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalDevices = allDevices.length
    const activeMachines = allMachines.filter(m => m.status === 'active').length
    const totalMachines = allMachines.length
    const inactiveMachines = allMachines.filter(m => m.status === 'inactive' || m.status === 'offline').length
    
    // Calculate system health (percentage of active machines)
    const systemHealth = totalMachines > 0 
      ? ((activeMachines / totalMachines) * 100).toFixed(1)
      : '0.0'
    
    // Calculate change (mock for now, could be calculated from previous period)
    const deviceChange = totalDevices > 0 ? "+0%" : "0%"
    const machineChange = activeMachines > 0 ? "+0%" : "0%"
    const healthChange = systemHealth !== '0.0' ? "+0%" : "0%"
    
    return [
      { label: "Total Devices", value: totalDevices.toLocaleString(), change: deviceChange },
      { label: "Active Machines", value: activeMachines.toLocaleString(), change: machineChange },
      { label: "System Health", value: `${systemHealth}%`, change: healthChange },
      { label: "Alerts", value: inactiveMachines.toLocaleString(), change: "-0%" },
    ]
  }, [allDevices, allMachines])

  // Calculate chart data from real data (group by month)
  const dashboardData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentDate = new Date()
    const last6Months: { name: string; devices: number; machines: number; active: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = monthNames[date.getMonth()]
      
      // Count devices created in this month
      const devicesInMonth = allDevices.filter(device => {
        const deviceDate = device.ts_iso ? new Date(device.ts_iso) : new Date(device.ts * 1000)
        return deviceDate.getFullYear() === date.getFullYear() && 
               deviceDate.getMonth() === date.getMonth()
      }).length

      // Count machines created in this month
      const machinesInMonth = allMachines.filter(machine => {
        const machineDate = new Date(machine.created_at)
        return machineDate.getFullYear() === date.getFullYear() && 
               machineDate.getMonth() === date.getMonth()
      }).length

      // Count active machines in this month (machines that were active at some point)
      const activeInMonth = allMachines.filter(machine => {
        const machineDate = new Date(machine.created_at)
        return machineDate.getFullYear() === date.getFullYear() && 
               machineDate.getMonth() === date.getMonth() &&
               machine.status === 'active'
      }).length

      last6Months.push({
        name: monthName,
        devices: devicesInMonth,
        machines: machinesInMonth,
        active: activeInMonth
      })
    }

    return last6Months
  }, [allDevices, allMachines])

  // Calculate recent activity from machines and devices
  const recentActivity = useMemo(() => {
    const activities: Array<{ event: string; time: string; status: string; timestamp: number }> = []
    
    // Format time ago
    const formatTimeAgo = (date: Date): string => {
      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
      const diffInDays = Math.floor(diffInHours / 24)

      if (diffInHours < 1) return "Just now"
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
      return date.toLocaleDateString()
    }

    // Add machine activities
    allMachines.forEach(machine => {
      const date = new Date(machine.updated_at || machine.created_at)
      const status = machine.status === 'active' ? 'success' : 
                     machine.status === 'maintenance' ? 'warning' : 'info'
      activities.push({
        event: `Machine ${machine.name} (${machine.machine_id}) ${machine.updated_at ? 'updated' : 'created'}`,
        time: formatTimeAgo(date),
        status,
        timestamp: date.getTime()
      })
    })

    // Add device activities
    allDevices.forEach(device => {
      const date = device.ts_iso ? new Date(device.ts_iso) : new Date(device.ts * 1000)
      activities.push({
        event: `Device ${device.device_id} location updated`,
        time: formatTimeAgo(date),
        status: 'success',
        timestamp: date.getTime()
      })
    })

    // Sort all activities by timestamp (most recent first) and take top 4
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 4)
      .map(({ timestamp, ...rest }) => rest) // Remove timestamp from final result
  }, [allMachines, allDevices])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your system overview.</p>
          </div>
        </div>

        {/* Machine Location Filter Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Machine Location Filter
                </CardTitle>
                <CardDescription>
                  Filter machines by country and city to view their locations on the map
                </CardDescription>
              </div>
              {(countryCode || cityCode) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Country</label>
                <div className="relative">
                  <Select 
                    value={countryCode || undefined} 
                    onValueChange={(value) => {
                      setCountryCode(value)
                    }}
                    onOpenChange={(open) => {
                      // Fetch countries when dropdown opens
                      if (open) {
                        fetchCountries()
                      }
                    }}
                  >
                    <SelectTrigger className={countryCode ? "pr-8" : ""}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingLocations ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : countries.length === 0 ? (
                        <SelectItem value="no-countries" disabled>Click to load countries</SelectItem>
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent z-10"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCountryCode("")
                        setCityCode("")
                      }}
                      type="button"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">City</label>
                <div className="relative">
                  <Select
                    value={cityCode || undefined}
                    onValueChange={setCityCode}
                    disabled={!countryCode}
                    onOpenChange={(open) => {
                      // Fetch cities when dropdown opens and country is selected
                      if (open && countryCode) {
                        fetchCitiesForCountry(countryCode)
                      }
                    }}
                  >
                    <SelectTrigger className={cityCode ? "pr-8" : ""} disabled={!countryCode}>
                      <SelectValue placeholder={countryCode ? "Select city (optional)" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingLocations ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : !countryCode ? (
                        <SelectItem value="no-country" disabled>Select country first</SelectItem>
                      ) : availableCities.length > 0 ? (
                        availableCities.map((city) => (
                          <SelectItem key={city.city_code} value={city.city_code}>
                            {city.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-cities" disabled>Click to load cities</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {cityCode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent z-10"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCityCode("")
                      }}
                      type="button"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {(countryCode || cityCode) && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>
                  Showing {filteredCount} machine{filteredCount !== 1 ? "s" : ""}
                  {countryCode && ` in ${countries.find((c) => c.country_code === countryCode)?.name}`}
                  {cityCode && `, ${availableCities.find((c) => c.city_code === cityCode)?.name}`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Machines Map */}
        {(countryCode || cityCode) && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Machines Location Map</CardTitle>
              <CardDescription>
                View all filtered machines on the map. Green markers indicate active machines, red markers indicate inactive ones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[600px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Loading machines...</p>
                  </div>
                </div>
              ) : (
                <MachinesMap 
                  machines={machines} 
                  height="600px"
                  onMachineSelect={setSelectedMachine}
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

        {/* Filtered Machines List - Hidden by default, can be toggled */}
        {(countryCode || cityCode) && machines.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filtered Machines ({filteredCount})</CardTitle>
                  <CardDescription>
                    {showList 
                      ? "List of machines matching your filter criteria" 
                      : "Click to view the list of all filtered machines"}
                  </CardDescription>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                    <div className="h-8 bg-muted rounded w-16 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            stats.map((stat) => (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <div className="flex items-baseline justify-between">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <span className="text-xs font-medium text-accent">{stat.change}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Device Activity</CardTitle>
              <CardDescription>Monthly device and machine statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                  <Legend />
                  <Bar dataKey="devices" fill="var(--accent)" />
                  <Bar dataKey="machines" fill="var(--muted)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>Active devices over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="active" stroke="var(--accent)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="h-6 bg-muted rounded w-16 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.event}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === "success"
                          ? "bg-green-100 text-green-700"
                          : item.status === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
