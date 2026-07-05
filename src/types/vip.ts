export interface VipGuest {
  id: string;
  fullName: string;
  email: string;
  sponsor: string;
  concertId: string;
  checkedInAt: string | null;
}

export interface VipCheckInResponse {
  success: boolean;
  message: string;
}

export interface VipListResponse {
  data: VipGuest[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
