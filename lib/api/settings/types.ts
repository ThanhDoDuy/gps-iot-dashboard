export interface RefreshMachineStatusResponse {
  success: boolean
  message: string
  updatedMachines?: number
  timestamp?: string
}

export interface CronStatsResponse {
  totalRuns: number
  totalErrors: number
  lastUpdateTime: string
  recentUpdates: Array<{
    tenantId: string
    machineId: string
    deviceId: string
    distance: number
    allowedRadius: number
    status: string
    reason: string
    timestamp: string
  }>
}

export interface ClearStatsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  clearedBy: string;
}

export interface SettingsApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}