"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"

const users = [
  { id: 1, name: "John Doe", email: "john@acmecoffee.com", role: "Admin", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@acmecoffee.com", role: "Manager", status: "Active" },
  { id: 3, name: "Bob Johnson", email: "bob@acmecoffee.com", role: "Operator", status: "Active" },
  { id: 4, name: "Alice Brown", email: "alice@acmecoffee.com", role: "Viewer", status: "Inactive" },
]

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">Manage team members and their permissions</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Add User</Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>All users in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input placeholder="Search users..." className="bg-input border-border" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground">{user.name}</td>
                      <td className="py-3 px-4 text-foreground">{user.email}</td>
                      <td className="py-3 px-4 text-foreground">{user.role}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10">
                          Edit
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
