"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"

const machines = [
  {
    id: "M-001",
    name: "Espresso Machine A",
    model: "EM-2000",
    location: "Floor 1",
    status: "Running",
    uptime: "99.2%",
  },
  { id: "M-002", name: "Cappuccino Machine B", model: "CM-3000", location: "Floor 2", status: "Idle", uptime: "98.8%" },
  {
    id: "M-003",
    name: "Espresso Machine C",
    model: "EM-2000",
    location: "Floor 3",
    status: "Maintenance",
    uptime: "97.5%",
  },
  { id: "M-004", name: "Latte Machine D", model: "LM-1500", location: "Floor 1", status: "Running", uptime: "99.5%" },
  {
    id: "M-005",
    name: "Cappuccino Machine E",
    model: "CM-3000",
    location: "Floor 2",
    status: "Running",
    uptime: "98.9%",
  },
]

export default function MachinesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Machines</h1>
            <p className="text-muted-foreground mt-1">Manage coffee machines and equipment</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Add Machine</Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Machine Fleet</CardTitle>
            <CardDescription>All machines in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input placeholder="Search machines..." className="bg-input border-border" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Machine ID</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Model</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Uptime</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((machine) => (
                    <tr key={machine.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground font-medium">{machine.id}</td>
                      <td className="py-3 px-4 text-foreground">{machine.name}</td>
                      <td className="py-3 px-4 text-foreground">{machine.model}</td>
                      <td className="py-3 px-4 text-foreground">{machine.location}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            machine.status === "Running"
                              ? "bg-green-100 text-green-700"
                              : machine.status === "Idle"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {machine.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground">{machine.uptime}</td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10">
                          Details
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
