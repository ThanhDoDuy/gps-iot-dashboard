"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Machine } from "@/lib/api/machines/types"
import { MapPin } from "lucide-react"

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

interface MachinesMapProps {
  machines: Machine[]
  height?: string
  onMachineSelect?: (machine: Machine) => void
}

// Component to handle map bounds fitting
function FitBounds({ machines }: { machines: Machine[] }) {
  const map = useMap()

  useEffect(() => {
    if (machines.length > 0) {
      const bounds = L.latLngBounds(
        machines.map((machine) => {
          const lat = machine.last_known_lat ?? machine.lat
          const lng = machine.last_known_lng ?? machine.lng
          return [lat, lng] as [number, number]
        })
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [machines, map])

  return null
}

export function MachinesMap({ machines, height = "600px", onMachineSelect }: MachinesMapProps) {
  if (machines.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg border border-border"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No machines to display on map</p>
        </div>
      </div>
    )
  }

  // Calculate center from machines
  const centerLat = machines.reduce((sum, m) => sum + (m.last_known_lat ?? m.lat), 0) / machines.length
  const centerLng = machines.reduce((sum, m) => sum + (m.last_known_lng ?? m.lng), 0) / machines.length

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <FitBounds machines={machines} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {machines.map((machine) => {
          const lat = machine.last_known_lat ?? machine.lat
          const lng = machine.last_known_lng ?? machine.lng
          const isActive = machine.status === "active"
          
          return (
            <div key={machine.machine_id}>
              <Marker
                position={[lat, lng]}
                icon={L.icon({
                  iconUrl: isActive
                    ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
                    : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                })}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold text-sm mb-2">{machine.name}</h3>
                    <div className="space-y-1 mb-3">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">ID:</span> {machine.machine_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Status:</span>{" "}
                        <span className={`font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {machine.status}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Address:</span> {machine.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Location:</span> {lat.toFixed(6)}, {lng.toFixed(6)}
                      </p>
                      {machine.radius && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Radius:</span> {machine.radius}m
                        </p>
                      )}
                    </div>
                    {onMachineSelect && (
                      <button
                        onClick={() => onMachineSelect(machine)}
                        className="w-full mt-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
              {machine.radius && (
                <Circle
                  center={[lat, lng]}
                  radius={machine.radius}
                  pathOptions={{
                    color: isActive ? "#22c55e" : "#ef4444",
                    fillColor: isActive ? "#22c55e" : "#ef4444",
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />
              )}
            </div>
          )
        })}
      </MapContainer>
    </div>
  )
}

