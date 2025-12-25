import api from './api';
import { Staff, ApiResponse } from '@/types';

export const staffService = {
  async getStaff(filters?: { isActive?: boolean }): Promise<ApiResponse<Staff[]>> {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    return api.get<Staff[]>(`/staff?${params.toString()}`);
  },

  async getStaffMember(id: string): Promise<ApiResponse<Staff>> {
    return api.get<Staff>(`/staff/${id}`);
  },

  async getStaffByService(serviceId: string): Promise<ApiResponse<Staff[]>> {
    return api.get<Staff[]>(`/staff/by-service/${serviceId}`);
  },

  async getStaffSchedule(staffId: string, date: string): Promise<ApiResponse<unknown>> {
    return api.get(`/staff/${staffId}/schedule?date=${date}`);
  },

  async getStaffAvailability(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<unknown>> {
    return api.get(`/staff/${staffId}/availability?startDate=${startDate}&endDate=${endDate}`);
  },
};

export default staffService;
