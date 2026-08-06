import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../lib/supabaseAdmin';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

async function hasConflict(
  facilityType: string,
  date: string,
  startTime: string,
  durationHours: number,
  excludeId?: string
): Promise<boolean> {
  if (facilityType === 'PARKING') return false; // unlimited quota, no conflict check

  let query = supabaseAdmin
    .from('bookings')
    .select('id, start_time, duration_hours')
    .eq('facility_type', facilityType)
    .eq('date', date)
    .eq('status', 'active');

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  if (error || !data) return false;

  const newStart = toMinutes(startTime);
  const newEnd = newStart + durationHours * 60;

  return data.some((b) => {
    const existingStart = toMinutes(b.start_time);
    const existingEnd = existingStart + b.duration_hours * 60;
    return newStart < existingEnd && existingStart < newEnd;
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  if (method === 'GET') {
    let query = supabaseAdmin.from('bookings').select('*').order('created_at', { ascending: false });

    if (req.query.user_id) {
      query = query.eq('user_id', String(req.query.user_id));
    } else if (req.query.id) {
      query = query.eq('id', String(req.query.id));
    } else if (req.query.facility_type && req.query.date) {
      query = query
        .eq('facility_type', String(req.query.facility_type))
        .eq('date', String(req.query.date))
        .eq('status', 'active');
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (method === 'POST') {
    const input = req.body ?? {};
    const required = ['id', 'facility_type', 'date', 'start_time', 'duration_hours', 'resident_unit'];
    for (const field of required) {
      if (!input[field]) return res.status(400).json({ error: `Missing required field: ${field}` });
    }

    const conflict = await hasConflict(input.facility_type, input.date, input.start_time, Number(input.duration_hours));
    if (conflict) {
      return res.status(409).json({ error: 'This time slot overlaps with an existing booking for this facility.' });
    }

    const booking = {
      id: input.id,
      facility_type: input.facility_type,
      date: input.date,
      start_time: input.start_time,
      duration_hours: Number(input.duration_hours),
      resident_unit: input.resident_unit,
      status: 'active',
      details: input.details ?? null,
      qr_code: input.qr_code ?? null,
      is_overnight: input.is_overnight ?? false,
      user_id: input.user_id ?? null,
    };

    const { data, error } = await supabaseAdmin.from('bookings').insert(booking).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (method === 'PATCH') {
    const input = req.body ?? {};
    if (!input.id) return res.status(400).json({ error: 'Missing booking id' });

    const update: Record<string, unknown> = {};
    if (input.status !== undefined) update.status = input.status;
    if (input.details !== undefined) update.details = input.details;

    const { data, error } = await supabaseAdmin.from('bookings').update(update).eq('id', input.id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (method === 'DELETE') {
    const id = req.query.id ? String(req.query.id) : undefined;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const { error } = await supabaseAdmin.from('bookings').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

  res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
