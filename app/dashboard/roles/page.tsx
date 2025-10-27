"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"

const permissions = [
  "ReadEmployee",
  "UpdateEmployee",
  "CreateEmployee",
  "ExportEmployee",
  "ImportEmployee",
  "DeleteEmployee",
  "ViewChart",
  "ExportChart",
  "ViewAllRolesAndPermissions",
  "UpdateUserRole",
  "UpdatePermissionsPerRole",
  "CreateProject",
  "UpdateProject",
  "DeleteProject",
]

const roles = [
  "BO",
  "Sub-Department Lead",
  "Supervisor",
  "HRBP",
  "C-Level",
  "C&B",
  "Admin",
  "Payroll",
  "Department Lead",
  "Accounting",
  "Division Lead",
  "HR",
]

// Sample permission matrix - true means role has permission
const permissionMatrix: Record<string, Record<string, boolean>> = {
  ReadEmployee: {
    BO: true,
    "Sub-Department Lead": true,
    Supervisor: true,
    HRBP: true,
    "C-Level": true,
    "C&B": true,
    Admin: true,
    Payroll: true,
    "Department Lead": true,
    Accounting: true,
    "Division Lead": true,
    HR: true,
  },
  UpdateEmployee: {
    BO: false,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": false,
    "C&B": true,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: false,
    "Division Lead": false,
    HR: true,
  },
  CreateEmployee: {
    BO: false,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": false,
    "C&B": true,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: false,
    "Division Lead": false,
    HR: true,
  },
  ExportEmployee: {
    BO: true,
    "Sub-Department Lead": true,
    Supervisor: false,
    HRBP: true,
    "C-Level": true,
    "C&B": true,
    Admin: true,
    Payroll: true,
    "Department Lead": true,
    Accounting: true,
    "Division Lead": true,
    HR: true,
  },
  ImportEmployee: {
    BO: false,
    "Sub-Department Lead": true,
    Supervisor: false,
    HRBP: true,
    "C-Level": true,
    "C&B": true,
    Admin: true,
    Payroll: true,
    "Department Lead": true,
    Accounting: true,
    "Division Lead": true,
    HR: true,
  },
  DeleteEmployee: {
    BO: false,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": false,
    "C&B": true,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: false,
    "Division Lead": false,
    HR: true,
  },
  ViewChart: {
    BO: true,
    "Sub-Department Lead": true,
    Supervisor: true,
    HRBP: true,
    "C-Level": true,
    "C&B": true,
    Admin: true,
    Payroll: true,
    "Department Lead": false,
    Accounting: true,
    "Division Lead": true,
    HR: true,
  },
  ExportChart: {
    BO: true,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": true,
    "C&B": true,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: true,
    "Division Lead": true,
    HR: true,
  },
  ViewAllRolesAndPermissions: {
    BO: false,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": false,
    "C&B": false,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: false,
    "Division Lead": false,
    HR: true,
  },
  UpdateUserRole: {
    BO: false,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": false,
    "C&B": false,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: false,
    "Division Lead": false,
    HR: false,
  },
  UpdatePermissionsPerRole: {
    BO: false,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": true,
    "C&B": false,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: false,
    "Division Lead": false,
    HR: false,
  },
  CreateProject: {
    BO: false,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": false,
    "C&B": true,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: false,
    "Division Lead": false,
    HR: true,
  },
  UpdateProject: {
    BO: false,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": false,
    "C&B": false,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: false,
    "Division Lead": false,
    HR: false,
  },
  DeleteProject: {
    BO: false,
    "Sub-Department Lead": false,
    Supervisor: false,
    HRBP: false,
    "C-Level": false,
    "C&B": false,
    Admin: true,
    Payroll: false,
    "Department Lead": false,
    Accounting: false,
    "Division Lead": false,
    HR: false,
  },
}

export default function RolesPage() {
  const [matrix, setMatrix] = useState(permissionMatrix)

  const togglePermission = (permission: string, role: string) => {
    setMatrix((prev) => ({
      ...prev,
      [permission]: {
        ...prev[permission],
        [role]: !prev[permission][role],
      },
    }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-muted-foreground mt-1">Manage permissions for each role</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>Check the box to grant a permission to a role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-foreground bg-muted sticky left-0 z-10 min-w-48">
                      Permissions
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role}
                        className="text-center p-3 font-semibold text-foreground bg-muted text-sm min-w-32"
                      >
                        <div className="break-words">{role}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr key={permission} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 font-medium text-foreground bg-muted/30 sticky left-0 z-10 min-w-48">
                        {permission}
                      </td>
                      {roles.map((role) => (
                        <td key={`${permission}-${role}`} className="text-center p-3">
                          <input
                            type="checkbox"
                            checked={matrix[permission]?.[role] || false}
                            onChange={() => togglePermission(permission, role)}
                            className="w-5 h-5 cursor-pointer accent-accent"
                          />
                        </td>
                      ))}
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
