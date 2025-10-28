"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usersApi } from "@/lib/api/users/api"
import { User } from "@/lib/api/users/types"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/auth-store"
import { Loader2, AlertTriangle } from "lucide-react"

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

export function DeleteUserModal({ isOpen, onClose, onSuccess, user }: DeleteUserModalProps) {
  const { toast } = useToast()
  const { accessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
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
      await usersApi.deleteUser(
        accessToken,
        user.user_id
      )
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to delete user:', err)
      toast({
        title: "Error",
        description: "Failed to delete user",
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
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium text-foreground">{user.full_name}</h4>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground">Role: {user.role_name}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
