"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"

const devices = [
  {
    id: "DEV-001",
    name: "Coffee Machine A",
    type: "Espresso",
    location: "Floor 1",
    status: "Online",
    lastSeen: "2 min ago",
  },
  {
    id: "DEV-002",
    name: "Coffee Machine B",
    type: "Cappuccino",
    location: "Floor 2",
    status: "Online",
    lastSeen: "5 min ago",
  },
  {
    id: "DEV-003",
    name: "Sensor Unit 1",
    type: "Temperature",
    location: "Storage",
    status: "Online",
    lastSeen: "1 min ago",
  },
  {
    id: "DEV-004",
    name: "Coffee Machine C",
    type: "Espresso",
    location: "Floor 3",
    status: "Offline",
    lastSeen: "2 hours ago",
  },
  {
    id: "DEV-005",
    name: "Sensor Unit 2",
    type: "Humidity",
    location: "Storage",
    status: "Online",
    lastSeen: "3 min ago",
  },
]

export default function DevicesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Devices</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage all connected IoT devices</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Add Device</Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
            <CardDescription>All devices in your network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input placeholder="Search devices..." className="bg-input border-border" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Device ID</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Last Seen</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground font-medium">{device.id}</td>
                      <td className="py-3 px-4 text-foreground">{device.name}</td>
                      <td className="py-3 px-4 text-foreground">{device.type}</td>
                      <td className="py-3 px-4 text-foreground">{device.location}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            device.status === "Online" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{device.lastSeen}</td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
