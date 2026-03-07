// PHP backend base URL — update for production
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost/Nadayu28/Nadayu28-booking-/backend';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'API error');
  return data as T;
}

// ── Booking types ─────────────────────────────────────────────────────
export interface BookingPayload {
  id: string;
  facility_type: string;
  date: string;
  start_time: string;
  duration_hours: number;
  resident_unit: string;
  status?: string;
  details?: string;
  qr_code?: string;
  is_overnight?: boolean;
  user_id?: string;
}

export interface ApiBooking extends BookingPayload {
  status: string;
  created_at?: string;
}

// ── API calls ─────────────────────────────────────────────────────────

export const bookingsApi = {
  getByUser: (userId: string) =>
    request<ApiBooking[]>(`api/bookings.php?user_id=${userId}`),

  getById: (id: string) =>
    request<ApiBooking[]>(`api/bookings.php?id=${id}`),

  create: (booking: BookingPayload) =>
    request<ApiBooking[]>('api/bookings.php', {
      method: 'POST',
      body: JSON.stringify(booking),
    }),

  updateStatus: (id: string, status: string) =>
    request<ApiBooking[]>('api/bookings.php', {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    }),

  validate: (id: string) =>
    request<{ valid: boolean; booking?: ApiBooking }>('api/validate.php', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
};
