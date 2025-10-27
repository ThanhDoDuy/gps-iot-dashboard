"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure system and organization settings</p>
        </div>

        <div className="space-y-6 max-w-2xl">
          {/* General Settings */}
          <Card className="bg-card border-border">
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
          </Card>

          {/* Security Settings */}
          <Card className="bg-card border-border">
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
          </Card>

          {/* Notification Settings */}
          <Card className="bg-card border-border">
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
          </Card>

          {/* API Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Manage API keys and integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">API Key</label>
                <div className="flex gap-2 mt-2">
                  <Input value="sk_live_••••••••••••••••" readOnly className="bg-input border-border" />
                  <Button variant="outline" className="text-foreground border-border bg-transparent">
                    Copy
                  </Button>
                </div>
              </div>
              <Button variant="outline" className="text-foreground border-border bg-transparent">
                Regenerate Key
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
