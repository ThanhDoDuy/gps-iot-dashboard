"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/auth-store"
import { useToast } from "@/hooks/use-toast"
import { settingsApi } from "@/lib/api/settings"
import { Loader2, RefreshCw, BarChart3, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const { accessToken } = useAuthStore()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isClearingStats, setIsClearingStats] = useState(false)
  const [staleMsInput, setStaleMsInput] = useState("")
  const [loadedConfigs, setLoadedConfigs] = useState<{ key: string; value: any; updated_at?: string | null }[]>([])
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  // Helpers to read/update specific config keys
  const getConfigValue = (key: string) => loadedConfigs.find((c) => c.key === key)?.value
  const setConfigValue = (key: string, value: any) =>
    setLoadedConfigs((prev) => {
      const idx = prev.findIndex((c) => c.key === key)
      if (idx === -1) return [...prev, { key, value }]
      const copy = [...prev]
      copy[idx] = { ...copy[idx], value }
      return copy
    })

  const handleRefreshMachineStatus = async () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "No access token available",
        variant: "destructive"
      })
      return;
    };

    try {
      setIsRefreshing(true)
      const response = await settingsApi.refreshMachineStatus(accessToken);
      
      if (response.success) {
        toast({
          title: "Success",
          description: response?.data.message || "Machine status updated successfully",
          variant: "default"
        })
      } else {
        toast({
          title: "Error",
          description: response?.data.message || "Failed to update machine status",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update machine status",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleGetCronStats = async () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "No access token available",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoadingStats(true)
      const response = await settingsApi.getCronStats(accessToken)
      
      console.log("Cron stats response:", response)
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Stats loaded: ${response.data.totalRuns} runs, ${response.data.totalErrors} errors`,
          variant: "default"
        })
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to load cron stats",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading cron stats:", error)
      toast({
        title: "Error",
        description: "Failed to load cron stats",
        variant: "destructive"
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleClearCronStats = async () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "No access token available",
        variant: "destructive"
      })
      return
    }

    try {
      setIsClearingStats(true)
      const response = await settingsApi.clearCronStats(accessToken)
      
      if (response.success) {
        toast({
          title: "Success",
          description: response?.message || "Cron stats cleared successfully",
          variant: "default"
        })
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to clear cron stats",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error clearing cron stats:", error)
      toast({
        title: "Error",
        description: "Failed to clear cron stats",
        variant: "destructive"
      })
    } finally {
      setIsClearingStats(false)
    }
  }

  const handleLoadTenantConfig = async () => {
    if (!accessToken) {
      toast({ title: "Error", description: "Missing access token", variant: "destructive" })
      return
    }
    try {
      setIsLoadingConfig(true)
      const response = await settingsApi.getTenantConfigs(accessToken)
      if (response.success) {
        // Map backend fields { config_key, config_value, updated_at }
        const mapped = (response.data || []).map((c: any) => ({ key: c.config_key, value: c.config_value, updated_at: c.updated_at }))
        setLoadedConfigs(mapped)
        const stale = mapped.find((c: any) => c.key === 'LOCATION_STALE_MS')
        if (stale) setStaleMsInput(String(stale.value ?? ''))
        toast({ title: "Loaded", description: `Loaded ${mapped.length} config(s)` })
      } else {
        toast({ title: "Error", description: response.message || 'Failed to load config', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: "Error", description: 'Failed to load config', variant: 'destructive' })
    } finally {
      setIsLoadingConfig(false)
    }
  }

  const handleSaveTenantConfig = async () => {
    if (!accessToken) {
      toast({ title: "Error", description: "Missing access token", variant: "destructive" })
      return
    }
    try {
      setIsSavingConfig(true)
      // Build payload from edited configs
      const payload = loadedConfigs.map((c) => ({
        key: c.key,
        value: c.key === 'LOCATION_STALE_MS' ? Number(c.value) : c.value,
      }))
      const response = await settingsApi.setTenantConfigs(accessToken, payload)
      if (response.success) {
        toast({ title: "Saved", description: `Updated ${payload.length} config(s)` })
      } else {
        toast({ title: "Error", description: response.message || 'Failed to save config', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: "Error", description: 'Failed to save config', variant: 'destructive' })
    } finally {
      setIsSavingConfig(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure system and organization settings</p>
        </div>

        <div className="space-y-6 max-w-2xl">
          {/* General Settings */}
          {/* <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">System Name</label>
                <Input defaultValue="IoT Cloud Tracker" className="mt-2 bg-input border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Time Zone</label>
                <Input defaultValue="UTC-5" className="mt-2 bg-input border-border" />
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
            </CardContent>
          </Card> */}

          {/* Security Settings */}
          {/* <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Button variant="outline" className="text-foreground border-border bg-transparent">
                  Enable
                </Button>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="font-medium text-foreground">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <Input defaultValue="30 min" className="w-24 bg-input border-border" />
              </div>
            </CardContent>
          </Card> */}

          {/* Notification Settings */}
          {/* <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure alert and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Device Alerts", description: "Notify on device status changes" },
                { label: "Maintenance Alerts", description: "Notify on maintenance requirements" },
                { label: "System Alerts", description: "Notify on system events" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
              ))}
            </CardContent>
          </Card> */}

          {/* System Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>System Actions</CardTitle>
              <CardDescription>Perform system maintenance and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">Update Machine Status</p>
                  <p className="text-sm text-muted-foreground">Update all machine statuses from latest data</p>
                </div>
                <Button 
                  onClick={handleRefreshMachineStatus}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isRefreshing ? "Refreshing..." : "Refresh Status"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="font-medium text-foreground">Cron Job Statistics</p>
                  <p className="text-sm text-muted-foreground">View cron job execution statistics</p>
                </div>
                <Button 
                  onClick={handleGetCronStats}
                  disabled={isLoadingStats}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isLoadingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  {isLoadingStats ? "Loading..." : "View Stats"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="font-medium text-foreground">Clear Statistics</p>
                  <p className="text-sm text-muted-foreground">Clear all cron job statistics data</p>
                </div>
                <Button 
                  onClick={handleClearCronStats}
                  disabled={isClearingStats}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  {isClearingStats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isClearingStats ? "Clearing..." : "Clear Stats"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Config */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Tenant Config</CardTitle>
              <CardDescription>Setup LOCATION_STALE_MS for a tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-4">
                {/* LOCATION_STALE_MS */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
                  <span className="font-mono">LOCATION_STALE_MS</span>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={String(getConfigValue('LOCATION_STALE_MS') ?? '')}
                      onChange={(e) => {
                        const raw = e.target.value
                        setConfigValue('LOCATION_STALE_MS', raw === '' ? '' : Number(raw))
                      }}
                      className="bg-input border-border"
                      placeholder="e.g. 5"
                    />
                    <span className="text-muted-foreground">minutes</span>
                  </div>
                </div>

                {/* NOTIFICATION_ENABLED */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
                  <span className="font-mono">NOTIFICATION_ENABLED</span>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(getConfigValue('NOTIFICATION_ENABLED'))}
                      onChange={(e) => setConfigValue('NOTIFICATION_ENABLED', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-muted-foreground">{Boolean(getConfigValue('NOTIFICATION_ENABLED')) ? 'true' : 'false'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleLoadTenantConfig} disabled={isLoadingConfig} variant="outline" className="flex items-center gap-2">
                  {isLoadingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Load Config
                </Button>
                <Button onClick={handleSaveTenantConfig} disabled={isSavingConfig} className="flex items-center gap-2">
                  {isSavingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Config
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
