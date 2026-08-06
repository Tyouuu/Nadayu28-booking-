import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../lib/supabaseAdmin';

const RESPONSE_TIMES: Record<string, string> = {
  'facility-malfunction': '4-6 hours',
  'common-area': '6-12 hours',
  'service-problem': '2-4 hours',
  other: '12-24 hours',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  if (method === 'GET') {
    let query = supabaseAdmin.from('maintenance_tasks').select('*').order('created_at', { ascending: false });

    if (req.query.user_id) {
      query = query.eq('user_id', String(req.query.user_id));
    } else if (req.query.id) {
      query = query.eq('id', String(req.query.id));
    }
    if (req.query.limit) {
      query = query.limit(Number(req.query.limit));
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (method === 'POST') {
    const input = req.body ?? {};
    const required = ['id', 'category', 'title'];
    for (const field of required) {
      if (!input[field]) return res.status(400).json({ error: `Missing required field: ${field}` });
    }

    const task = {
      id: input.id,
      category: input.category,
      subcategory: input.subcategory ?? null,
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? 'Common Area',
      priority: input.priority ?? 'medium',
      status: 'reported',
      images: input.images ?? [],
      resident_unit: input.resident_unit ?? null,
      user_id: input.user_id ?? null,
      expected_response: RESPONSE_TIMES[input.category] ?? RESPONSE_TIMES.other,
    };

    const { data, error } = await supabaseAdmin.from('maintenance_tasks').insert(task).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (method === 'PATCH') {
    const input = req.body ?? {};
    if (!input.id) return res.status(400).json({ error: 'Missing task id' });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.status !== undefined) update.status = input.status;

    const { data, error } = await supabaseAdmin.from('maintenance_tasks').update(update).eq('id', input.id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}
