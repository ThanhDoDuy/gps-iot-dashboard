"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet"
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
  onLocationSelect?: (lat: number, lng: number) => void
  centerPoint?: { lat: number; lng: number } | null
  radiusKm?: number
  selectable?: boolean
}

// Component to handle map bounds fitting
function FitBounds({ machines }: { machines: Machine[] }) {
  const map = useMap()

  useEffect(() => {
    if (machines.length > 0) {
      const bounds = L.latLngBounds(
        machines.map((machine) => {
          const lat = machine.device?.latitude ?? machine.lat
          const lng = machine.device?.longitude ?? machine.lng
          return [lat, lng] as [number, number]
        })
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [machines, map])

  return null
}

// Component to handle map click for location selection
function MapClickHandler({ 
  onLocationSelect, 
  selectable 
}: { 
  onLocationSelect?: (lat: number, lng: number) => void
  selectable?: boolean 
}) {
  useMapEvents({
    click: (e) => {
      if (selectable && onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

export function MachinesMap({ 
  machines, 
  height = "600px", 
  onMachineSelect,
  onLocationSelect,
  centerPoint,
  radiusKm,
  selectable = false
}: MachinesMapProps) {

  // If selectable mode, always show map even without machines
  // Otherwise, show empty state if no machines
  if (!selectable && machines.length === 0) {
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

  // Calculate center from machines, centerPoint, or default location
  let centerLat: number
  let centerLng: number
  
  if (centerPoint) {
    centerLat = centerPoint.lat
    centerLng = centerPoint.lng
  } else if (machines.length > 0) {
    centerLat = machines.reduce((sum, m) => sum + (m.device?.latitude ?? m.lat), 0) / machines.length
    centerLng = machines.reduce((sum, m) => sum + (m.device?.longitude ?? m.lng), 0) / machines.length
  } else {
    // Default center (Ho Chi Minh City, Vietnam)
    centerLat = 10.8231
    centerLng = 106.6297
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={selectable && machines.length === 0 ? 12 : 10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        {machines.length > 0 && <FitBounds machines={machines} />}
        <MapClickHandler onLocationSelect={onLocationSelect} selectable={selectable} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Center point marker and radius circle */}
        {centerPoint && (
          <>
            <Marker
              position={[centerPoint.lat, centerPoint.lng]}
              icon={L.icon({
                iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
              })}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-1">Selected Location</h3>
                  <p className="text-xs text-muted-foreground">
                    {centerPoint.lat.toFixed(6)}, {centerPoint.lng.toFixed(6)}
                  </p>
                  {radiusKm && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Radius: {radiusKm} km
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
            {radiusKm && (
              <Circle
                center={[centerPoint.lat, centerPoint.lng]}
                radius={radiusKm * 1000} // Convert km to meters
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.2,
                  weight: 2,
                }}
              />
            )}
          </>
        )}
        {machines.map((machine) => {
          const lat = machine.device?.latitude ?? machine.lat
          const lng = machine.device?.longitude ?? machine.lng
          const isActive = machine.status === "active"
          
          // Validate coordinates
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            return null
          }
          
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

