"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { machinesApi } from "@/lib/api/machines"
import { useAuthStore } from "@/lib/auth-store"
import { Machine } from "@/lib/api/machines/types"

export default function MachinesPage() {
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchMachines = async () => {
    
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await machinesApi.getMachines(accessToken)
      setMachines(response.data)
    } catch (err) {
      setError('Failed to load machines')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMachines()
  }, [isAuthenticated, accessToken])

  const filteredMachines = machines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-700"
      case 'inactive':
        return "bg-red-100 text-red-700"
      case 'maintenance':
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
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

  const handleViewDetails = (machine: Machine) => {
    router.push(`/dashboard/machines/${machine.machine_id}`)
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Machines</h1>
            <p className="text-muted-foreground mt-1">Manage coffee machines and equipment</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push('/dashboard/machines/create')}
          >
            Add Machine
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Machine Fleet</CardTitle>
            <CardDescription>All machines in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input 
                placeholder="Search machines..." 
                className="bg-input border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchMachines} variant="outline">
                  Retry
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-foreground">Machine ID</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Device ID</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Address</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Last Check</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMachines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No machines found matching your search' : 'No machines available'}
                        </td>
                      </tr>
                    ) : (
                      filteredMachines.map((machine) => (
                        <tr key={machine.machine_id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground font-medium">{machine.machine_id}</td>
                          <td className="py-3 px-4 text-foreground">{machine.name}</td>
                          <td className="py-3 px-4 text-foreground font-mono text-xs">{machine.device_id}</td>
                          <td className="py-3 px-4 text-foreground max-w-xs truncate" title={machine.address}>
                            {machine.address}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(machine.status)}`}
                            >
                              {machine.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground text-xs">
                            {formatDate(machine.last_location_check)}
                          </td>
                          <td className="py-3 px-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-accent hover:bg-accent/10"
                              onClick={() => handleViewDetails(machine)}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
