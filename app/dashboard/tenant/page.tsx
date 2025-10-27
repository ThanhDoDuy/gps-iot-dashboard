"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { tenantApi } from "@/lib/api/tenant"
import { useAuthStore } from "@/lib/auth-store"
import { Tenant } from "@/lib/api/tenant/types"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiKeyDisplay } from "@/components/ui/api-key-display"

export default function TenantPage() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async () => {
    
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true);
      setError(null);
      const resBody = await tenantApi.getCurrentTenant(accessToken);
      setTenant(resBody.data);
    } catch (err) {
      setError('Failed to load tenant information');
      console.error('Error fetching tenant:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTenant()
  }, [isAuthenticated, accessToken]);
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tenant Information</h1>
            <p className="text-muted-foreground mt-1">Manage your organization details and settings</p>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button 
                  onClick={fetchTenant} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenant Information</h1>
          <p className="text-muted-foreground mt-1">Manage your organization details and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-8 mb-2" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              ) : tenant ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                      <p className="text-foreground font-medium mt-1">{tenant.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tenant ID</label>
                      <p className="text-foreground font-medium mt-1">{tenant.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Admin Email</label>
                      <p className="text-foreground font-medium mt-1">{tenant.adminEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Plan</label>
                      <p className="text-foreground font-medium mt-1 capitalize">{tenant.plan}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Country</label>
                      <p className="text-foreground font-medium mt-1">{tenant.country}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">API Key</label>
                      <div className="mt-1">
                        <ApiKeyDisplay apiKey={tenant.api_key} />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Created At</label>
                      <p className="text-foreground font-medium mt-1">
                        {new Date(tenant.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="text-foreground font-medium mt-1 capitalize">{tenant.status}</p>
                    </div>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Edit Details</Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tenant information available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-8 w-14" />
                  </div>
                </div>
              ) : tenant ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Totals Users</p>
                      <p className="text-2xl font-bold text-foreground capitalize">N/A</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Totals Devices</p>
                      <p className="text-2xl font-bold text-foreground capitalize">N/A</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Totals Machines</p>
                      <p className="text-2xl font-bold text-foreground">N/A</p>
                    </div>
                  </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No statistics available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
