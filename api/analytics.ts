import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../lib/supabaseAdmin';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString();

  const [bookingsRes, tasksRes, recentTasksRes] = await Promise.all([
    supabaseAdmin.from('bookings').select('facility_type, duration_hours, created_at').gte('created_at', since),
    supabaseAdmin.from('maintenance_tasks').select('status'),
    supabaseAdmin.from('maintenance_tasks').select('*').order('created_at', { ascending: false }).limit(10),
  ]);

  if (bookingsRes.error) return res.status(500).json({ error: bookingsRes.error.message });
  if (tasksRes.error) return res.status(500).json({ error: tasksRes.error.message });
  if (recentTasksRes.error) return res.status(500).json({ error: recentTasksRes.error.message });

  // Facility usage: total hours booked per facility, last 7 days
  const facilityHours = new Map<string, number>();
  for (const b of bookingsRes.data ?? []) {
    facilityHours.set(b.facility_type, (facilityHours.get(b.facility_type) ?? 0) + (b.duration_hours ?? 0));
  }
  const facilityUsage = Array.from(facilityHours.entries()).map(([name, hours]) => ({ name, hours }));

  // Bookings per day, last 7 days (by created_at day-of-week bucket)
  const dayBuckets = new Map<string, number>();
  for (const b of bookingsRes.data ?? []) {
    const label = DAY_LABELS[new Date(b.created_at).getDay()];
    dayBuckets.set(label, (dayBuckets.get(label) ?? 0) + 1);
  }
  const bookingsByDay = DAY_LABELS.map((name) => ({ name, bookings: dayBuckets.get(name) ?? 0 }));

  // Maintenance task counts by status
  const statusCounts = new Map<string, number>();
  for (const t of tasksRes.data ?? []) {
    statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1);
  }
  const taskStatusBreakdown = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  return res.status(200).json({
    facilityUsage,
    bookingsByDay,
    taskStatusBreakdown,
    recentMaintenanceTasks: recentTasksRes.data,
  });
}
