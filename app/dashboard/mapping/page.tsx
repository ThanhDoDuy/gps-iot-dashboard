"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"

// Sample data for devices and machines
const devices = [
  { id: "D001", name: "Device 001", location: "Floor 1", machineId: "M001" },
  { id: "D002", name: "Device 002", location: "Floor 1", machineId: "M002" },
  { id: "D003", name: "Device 003", location: "Floor 2", machineId: null },
  { id: "D004", name: "Device 004", location: "Floor 2", machineId: null },
  { id: "D005", name: "Device 005", location: "Floor 3", machineId: "M003" },
]

const machines = [
  { id: "M001", name: "Machine A", location: "Floor 1", deviceId: "D001" },
  { id: "M002", name: "Machine B", location: "Floor 1", deviceId: "D002" },
  { id: "M003", name: "Machine C", location: "Floor 3", deviceId: "D005" },
  { id: "M004", name: "Machine D", location: "Floor 2", deviceId: null },
]

export default function MappingPage() {
  const [linkedPairs, setLinkedPairs] = useState(
    devices.reduce(
      (acc, device) => {
        if (device.machineId) {
          acc[device.id] = device.machineId
        }
        return acc
      },
      {} as Record<string, string>,
    ),
  )

  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null)

  const handleLink = () => {
    if (selectedDevice && selectedMachine) {
      setLinkedPairs((prev) => ({
        ...prev,
        [selectedDevice]: selectedMachine,
      }))
      setSelectedDevice(null)
      setSelectedMachine(null)
    }
  }

  const handleUnlink = (deviceId: string) => {
    setLinkedPairs((prev) => {
      const newPairs = { ...prev }
      delete newPairs[deviceId]
      return newPairs
    })
  }

  const unlinkedDevices = devices.filter((d) => !linkedPairs[d.id])
  const unlinkedMachines = machines.filter((m) => !Object.values(linkedPairs).includes(m.id))
  const linkedDevices = devices.filter((d) => linkedPairs[d.id])

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
              <CardDescription>Active device-machine connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {linkedDevices.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No linked pairs yet</p>
                ) : (
                  linkedDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{device.name}</p>
                        <p className="text-xs text-muted-foreground">{device.location}</p>
                      </div>
                      <div className="px-3 text-muted-foreground">↔</div>
                      <div className="flex-1 text-right">
                        <p className="font-medium text-foreground">
                          {machines.find((m) => m.id === linkedPairs[device.id])?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {machines.find((m) => m.id === linkedPairs[device.id])?.location}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlink(device.id)}
                        className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Unlink
                      </Button>
                    </div>
                  ))
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
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.location})
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
                    <option key={machine.id} value={machine.id}>
                      {machine.name} ({machine.location})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleLink}
                disabled={!selectedDevice || !selectedMachine}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              >
                Link Device to Machine
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
                    <div key={device.id} className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium text-foreground">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.location}</p>
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
                    <div key={machine.id} className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium text-foreground">{machine.name}</p>
                      <p className="text-xs text-muted-foreground">{machine.location}</p>
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
