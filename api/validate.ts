import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const input = req.body ?? {};
  if (!input.id) {
    return res.status(400).json({ valid: false, error: 'Missing booking id' });
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', input.id)
    .eq('status', 'active')
    .limit(1);

  if (error) return res.status(500).json({ valid: false, error: error.message });

  if (data && data.length > 0) {
    return res.status(200).json({ valid: true, booking: data[0] });
  }
  return res.status(200).json({ valid: false });
}
