"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
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

export default function DashboardPage() {
  const { toast } = useToast()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your system overview.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                toast({
                  title: "Test Toast",
                  description: "This is a test toast message to check if it's working properly.",
                  variant: "destructive"
                })
              }}
              variant="outline"
              size="sm"
            >
              Test Toast
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: "Success",
                  description: "This is a success toast message.",
                  variant: "default"
                })
              }}
              variant="outline"
              size="sm"
            >
              Success Toast
            </Button>
          </div>
        </div>

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
