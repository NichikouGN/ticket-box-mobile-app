import { apiClient } from './api';
import { CheckinResult, CheckinStats } from '@/types/checkin';

export const checkinService = {
  async verifyQR(qrSha256: string, concertId: string): Promise<CheckinResult> {
    const response = await apiClient.post<any>('/checkin/verify', {
      qr_sha256: qrSha256,
      concert_id: concertId,
    });
    
    const res = response.data;
    const rd = res?.data || res;
    
    if (!rd) {
      throw new Error('No check-in details returned from server');
    }
    
    return {
      success: res?.success ?? rd.success ?? false,
      result: rd.result || 'INVALID',
      ticketId: rd.ticket_id || rd.ticketId,
      holderName: rd.holder_name || rd.holderName,
      ticketType: rd.ticket_type || rd.ticketType,
      checkedInAt: rd.checked_in_at || rd.checkedInAt,
      usedAt: rd.used_at || rd.usedAt,
      usedByStaff: rd.used_by_staff || rd.usedByStaff,
      message: rd.message || '',
    };
  },

  async getStats(concertId: string): Promise<CheckinStats> {
    const response = await apiClient.get<any>(`/checkin/stats/${concertId}`);
    const rd = response.data?.data || response.data;
    
    if (!rd) {
      throw new Error('No statistics details returned from server');
    }
    
    return {
      totalTickets: rd.total_tickets ?? rd.totalTickets ?? 0,
      checkedIn: rd.checked_in ?? rd.scanned_tickets ?? rd.checkedIn ?? rd.scannedTickets ?? 0,
      scannedTickets: rd.scanned_tickets ?? rd.checked_in ?? rd.scannedTickets ?? rd.checkedIn ?? 0,
      remaining: rd.remaining ?? rd.remaining_tickets ?? rd.remainingTickets ?? 0,
      remainingTickets: rd.remaining_tickets ?? rd.remaining ?? rd.remainingTickets ?? 0,
      byTicketType: (rd.by_ticket_type || rd.byTicketType || []).map((item: any) => ({
        name: item.name,
        total: item.total,
        checkedIn: item.checked_in ?? item.scanned_tickets ?? item.checkedIn ?? item.scannedTickets ?? 0,
        scannedTickets: item.scanned_tickets ?? item.checked_in ?? item.scannedTickets ?? item.checkedIn ?? 0,
      })),
    };
  },
};
