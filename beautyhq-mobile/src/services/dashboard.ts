import api from './api';
import { DashboardStats, ApiResponse } from '@/types';

export const dashboardService = {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return api.get<DashboardStats>('/dashboard/stats');
  },

  async getTodayOverview(): Promise<ApiResponse<{
    appointments: number;
    completedAppointments: number;
    revenue: number;
    newClients: number;
    walkIns: number;
  }>> {
    return api.get('/dashboard/today');
  },

  async getRevenueStats(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{
    current: number;
    previous: number;
    percentChange: number;
    chartData: Array<{ date: string; revenue: number }>;
  }>> {
    return api.get(`/dashboard/revenue?period=${period}`);
  },

  async getAppointmentStats(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    chartData: Array<{ date: string; count: number }>;
  }>> {
    return api.get(`/dashboard/appointments?period=${period}`);
  },

  async getTopServices(limit = 5): Promise<ApiResponse<Array<{
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }>>> {
    return api.get(`/dashboard/top-services?limit=${limit}`);
  },

  async getTopStaff(limit = 5): Promise<ApiResponse<Array<{
    staffId: string;
    staffName: string;
    appointments: number;
    revenue: number;
  }>>> {
    return api.get(`/dashboard/top-staff?limit=${limit}`);
  },
};

export default dashboardService;
