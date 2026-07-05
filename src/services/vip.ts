import { apiClient } from './api';
import { VipCheckInResponse } from '@/types/vip';

export const vipService = {
  async checkInVip(concertId: string, vipGuestId: string): Promise<VipCheckInResponse> {
    const response = await apiClient.patch<VipCheckInResponse>(
      `/staff/concerts/${concertId}/vip-guests/${vipGuestId}/check-in`
    );
    return response.data;
  }
};
