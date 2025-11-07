"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/auth-store"
import { machinesApi } from "@/lib/api/machines"
import { Machine } from "@/lib/api/machines/types"
import { MachinesMap } from "@/components/machines-map"
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

const dashboardData = [
  { name: "Jan", devices: 40, machines: 24, active: 32 },
  { name: "Feb", devices: 45, machines: 28, active: 38 },
  { name: "Mar", devices: 50, machines: 32, active: 42 },
  { name: "Apr", devices: 55, machines: 35, active: 48 },
  { name: "May", devices: 60, machines: 38, active: 52 },
  { name: "Jun", devices: 65, machines: 42, active: 58 },
]

const stats = [
  { label: "Total Devices", value: "1,234", change: "+12%" },
  { label: "Active Machines", value: "856", change: "+8%" },
  { label: "System Health", value: "98.5%", change: "+2%" },
  { label: "Alerts", value: "23", change: "-5%" },
]

// Predefined country and city options
const countries = [
  { value: "vietnam", label: "Vietnam" },
  { value: "thailand", label: "Thailand" },
]

const cities: Record<string, { value: string; label: string }[]> = {
  vietnam: [
    { value: "hcm", label: "Ho Chi Minh City" },
    { value: "danang", label: "Da Nang" },
    { value: "hanoi", label: "Hanoi" },
  ],
  thailand: [
    { value: "bangkok", label: "Bangkok" },
    { value: "pattaya", label: "Pattaya" },
  ],
}

export default function DashboardPage() {
  const { toast } = useToast()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [countryCode, setCountryCode] = useState<string>("vietnam")
  const [cityCode, setCityCode] = useState<string>("hcm")
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
      setMachines(response.data || [])
      setFilteredCount(response.total || 0)
    } catch (error: any) {
      console.error("Error fetching filtered machines:", error)
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
    setCountryCode("")
    setCityCode("")
  }

  const availableCities = countryCode ? cities[countryCode] || [] : []

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
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
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
                <label className="text-sm font-medium mb-2 block">City</label>
                <div className="relative">
                  <Select
                    value={cityCode || undefined}
                    onValueChange={setCityCode}
                    disabled={!countryCode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={countryCode ? "Select city (optional)" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
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
            {(countryCode || cityCode) && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>
                  Showing {filteredCount} machine{filteredCount !== 1 ? "s" : ""}
                  {countryCode && ` in ${countries.find((c) => c.value === countryCode)?.label}`}
                  {cityCode && `, ${availableCities.find((c) => c.value === cityCode)?.label}`}
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
                      {(selectedMachine.last_known_lat ?? selectedMachine.lat).toFixed(6)}, {" "}
                      {(selectedMachine.last_known_lng ?? selectedMachine.lng).toFixed(6)}
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
                    const lat = machine.last_known_lat ?? machine.lat
                    const lng = machine.last_known_lng ?? machine.lng
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
          {stats.map((stat) => (
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
          ))}
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
            <div className="space-y-4">
              {[
                { event: "Device CM-001 connected", time: "2 hours ago", status: "success" },
                { event: "Maintenance alert for Machine M-45", time: "4 hours ago", status: "warning" },
                { event: "User John Doe added to tenant", time: "1 day ago", status: "info" },
                { event: "System backup completed", time: "2 days ago", status: "success" },
              ].map((item, idx) => (
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
