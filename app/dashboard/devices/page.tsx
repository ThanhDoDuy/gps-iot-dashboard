"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { devicesApi } from "@/lib/api/devices"
import { useAuthStore } from "@/lib/auth-store"
import { Device, PaginationMeta } from "@/lib/api/devices/types"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search } from "lucide-react"

export default function DevicesPage() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const fetchDevices = async (page: number = 1, search?: string) => {
    if (!isAuthenticated || !accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const skip = (page - 1) * limit;
      const response = await devicesApi.getAllDevices(accessToken, {
        limit,
        skip,
        search: search || undefined
      });
      console.log("Devices response:", response);
      setDevices(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error("Error fetching devices:", err);
      setError('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices(currentPage, searchTerm);
  }, [isAuthenticated, accessToken, currentPage, searchTerm]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return "Never";
    
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return "Never";
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const totalPages = pagination.totalPages;
    const current = pagination.page;

    // Always show first page
    if (current > 3) {
      pages.push(1);
      if (current > 4) pages.push('ellipsis-start');
    }

    // Show pages around current page
    for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
      pages.push(i);
    }

    // Always show last page
    if (current < totalPages - 2) {
      if (current < totalPages - 3) pages.push('ellipsis-end');
      pages.push(totalPages);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => pagination.hasPrev && handlePageChange(current - 1)}
              className={!pagination.hasPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          
          {pages.map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => handlePageChange(page as number)}
                  isActive={current === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          <PaginationItem>
            <PaginationNext
              onClick={() => pagination.hasNext && handlePageChange(current + 1)}
              className={!pagination.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Devices</h1>
          <p className="text-muted-foreground mt-1">Monitor all connected IoT devices</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
            <CardDescription>All devices in your network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Input 
                  placeholder="Search by device_id, country, model, city" 
                  className="bg-input border-border pr-10"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => fetchDevices(currentPage, searchTerm)} variant="outline">
                  Retry
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-foreground">Device ID</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Model</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">City</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Country</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Last Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No devices found matching your search' : 'No devices available'}
                        </td>
                      </tr>
                    ) : (
                      devices.map((device) => (
                        <tr key={device.device_id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground font-medium">{device.device_id}</td>
                          <td className="py-3 px-4 text-foreground">{device.model || "-"}</td>
                          <td className="py-3 px-4 text-foreground">{device.city || "-"}</td>
                          <td className="py-3 px-4 text-foreground">{device.country || "-"}</td>
                          <td className="py-3 px-4 text-foreground text-xs font-mono">
                            {device.latitude != null && device.longitude != null
                              ? `${Number(device.latitude).toFixed(6)}, ${Number(device.longitude).toFixed(6)}`
                              : "-"
                            }
                          </td>
                          <td className="py-3 px-4 text-foreground text-xs">
                            {formatDate(device.ts || device.ts_iso)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {pagination.skip + 1} to {Math.min(pagination.skip + pagination.limit, pagination.total)} of {pagination.total} devices
                </div>
                {renderPagination()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
