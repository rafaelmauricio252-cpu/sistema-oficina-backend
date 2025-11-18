import { api } from './api';
import type { DashboardStats } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard');
    return response.data.estatisticas;
  },
};

export default dashboardService;
