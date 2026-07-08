import { apiClient } from './api';
import { VipCheckInResponse, VipListResponse } from '@/types/vip';

export const vipService = {
  async getVipGuests(
    concertId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<VipListResponse> {
    // Note: Backend does not currently support filtering by search on the server-side,
    // so client-side filtering will be used on the search string.
    const response = await apiClient.get<VipListResponse>(
      `/staff/concerts/${concertId}/vip-guests`,
      {
        params: { page, limit }
      }
    );
    return response.data;
  },

  async checkInVip(concertId: string, vipGuestId: string): Promise<VipCheckInResponse> {
    const response = await apiClient.patch<VipCheckInResponse>(
      `/staff/concerts/${concertId}/vip-guests/${vipGuestId}/check-in`
    );
    return response.data;
  }
};
