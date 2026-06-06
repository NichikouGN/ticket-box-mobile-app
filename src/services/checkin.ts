import { apiClient } from './api';
import { RawCheckinResponse, CheckinResult, RawCheckinStats, CheckinStats } from '@/types/checkin';

export const checkinService = {
  async verifyQR(qrSha256: string, concertId: string): Promise<CheckinResult> {
    const response = await apiClient.post<RawCheckinResponse>('/checkin/verify', {
      qr_sha256: qrSha256,
      concert_id: concertId,
    });
    
    const res = response.data;
    const rd = res.data;
    
    return {
      success: res.success,
      result: rd.result,
      ticketId: rd.ticket_id,
      holderName: rd.holder_name,
      ticketType: rd.ticket_type,
      checkedInAt: rd.checked_in_at,
      usedAt: rd.used_at,
      usedByStaff: rd.used_by_staff,
      message: rd.message,
    };
  },

  async getStats(concertId: string): Promise<CheckinStats> {
    const response = await apiClient.get<{ success: boolean; data: RawCheckinStats }>(`/checkin/stats/${concertId}`);
    const rd = response.data.data;
    
    return {
      totalTickets: rd.total_tickets,
      checkedIn: rd.checked_in ?? rd.scanned_tickets ?? 0,
      scannedTickets: rd.scanned_tickets ?? rd.checked_in ?? 0,
      remaining: rd.remaining ?? rd.remaining_tickets ?? 0,
      remainingTickets: rd.remaining_tickets ?? rd.remaining ?? 0,
      byTicketType: (rd.by_ticket_type || []).map(item => ({
        name: item.name,
        total: item.total,
        checkedIn: item.checked_in ?? item.scanned_tickets ?? 0,
        scannedTickets: item.scanned_tickets ?? item.checked_in ?? 0,
      })),
    };
  },
};
