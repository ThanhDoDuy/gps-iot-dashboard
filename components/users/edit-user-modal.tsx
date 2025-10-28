"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usersApi } from "@/lib/api/users/api"
import { rolesApi } from "@/lib/api/roles/api"
import { User } from "@/lib/api/users/types"
import { Role } from "@/lib/api/roles/types"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/auth-store"
import { Loader2 } from "lucide-react"

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const { toast } = useToast()
  const { accessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role_id: "",
    is_active: true,
  })

  // Fetch roles when modal opens
  const fetchRoles = async () => {
    if (!accessToken) return;

    setIsLoadingRoles(true);
    try {
      const response = await rolesApi.getRoles(accessToken);
      setRoles(response.data);
    } catch (err) {
      console.error('Failed to load roles:', err);
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchRoles();
    }
  }, [isOpen, accessToken]);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
        is_active: user.is_active,
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    if (!accessToken) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await usersApi.updateUser(
        accessToken,
        user.user_id,
        {
          full_name: formData.full_name,
          role_id: formData.role_id,
          is_active: formData.is_active,
        }
      )
      
      toast({
        title: "Success",
        description: "User updated successfully",
      })
      
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to update user:', err)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Email cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, role_id: value }));
                }}
                required
                disabled={isLoadingRoles}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={isLoadingRoles ? "Loading roles..." : "Select a role"}
                  >
                    {formData.role_id ? roles.find(role => role.role_id === formData.role_id)?.name : "Select a role"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role, index) => {
                    return (
                      <SelectItem key={role.role_id || `role-${index}`} value={role.role_id}>
                        {role.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === "active" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
