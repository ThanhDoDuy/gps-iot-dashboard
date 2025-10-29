// Dashboard API Types

export interface DashboardStats {
  totalDevices: number;
  activeMachines: number;
  systemHealth: number;
  alerts: number;
  change: {
    totalDevices: string;
    activeMachines: string;
    systemHealth: string;
    alerts: string;
  };
}

export interface ChartDataPoint {
  name: string;
  devices: number;
  machines: number;
  active: number;
  timestamp: string;
}

export interface RecentActivity {
  id: string;
  event: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
  type: 'device' | 'machine' | 'user' | 'system';
  details?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  recentActivity: RecentActivity[];
}

export interface DashboardFilters {
  dateRange?: {
    start: string;
    end: string;
  };
}

