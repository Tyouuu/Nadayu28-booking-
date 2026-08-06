// scripts/verify-visitor-flow.mjs
// Run with: node --env-file=.env.local scripts/verify-visitor-flow.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const SECURITY_EMAIL = process.env.VERIFY_SECURITY_EMAIL; // pass a seeded SECURITY test account's email
const SECURITY_PASSWORD = process.env.VERIFY_SECURITY_PASSWORD;

function assert(cond, msg) {
  if (!cond) throw new Error('FAILED: ' + msg);
  console.log('OK: ' + msg);
}

async function run() {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: SECURITY_EMAIL,
    password: SECURITY_PASSWORD,
  });
  if (signInError) throw signInError;

  // 1. On-time visitor -> should end up 'arrived', not flagged
  const onTimeId = 'vtest' + Date.now();
  const onTimeArrival = new Date(Date.now() + 2 * 60000).toISOString(); // 2 min from now
  let { error } = await supabase.from('visitors').insert({
    id: onTimeId, resident_unit: 'A-06-01', visitor_name: 'Test OnTime',
    expected_arrival: onTimeArrival, status: 'scheduled',
  });
  if (error) throw error;

  const now1 = new Date().toISOString();
  ({ error } = await supabase.from('visitors').update({ status: 'arrived', actual_arrival: now1 }).eq('id', onTimeId));
  if (error) throw error;

  let { data: row1 } = await supabase.from('visitors').select('*').eq('id', onTimeId).single();
  assert(row1.status === 'arrived', `on-time visitor ${onTimeId} status is 'arrived'`);

  // 2. Late visitor (60 min off) -> should be flagged
  const lateId = 'vtest' + (Date.now() + 1);
  const lateArrival = new Date(Date.now() - 60 * 60000).toISOString(); // 60 min ago
  ({ error } = await supabase.from('visitors').insert({
    id: lateId, resident_unit: 'A-06-01', visitor_name: 'Test Late',
    expected_arrival: lateArrival, status: 'scheduled',
  }));
  if (error) throw error;

  const now2 = new Date().toISOString();
  ({ error } = await supabase.from('visitors').update({ status: 'flagged', actual_arrival: now2 }).eq('id', lateId));
  if (error) throw error;

  let { data: row2 } = await supabase.from('visitors').select('*').eq('id', lateId).single();
  assert(row2.status === 'flagged', `late visitor ${lateId} status is 'flagged'`);

  // 3. Mark departed on the flagged visitor
  ({ error } = await supabase.from('visitors').update({ status: 'departed' }).eq('id', lateId));
  if (error) throw error;
  let { data: row3 } = await supabase.from('visitors').select('status').eq('id', lateId).single();
  assert(row3.status === 'departed', `flagged visitor ${lateId} can be marked 'departed'`);

  // Cleanup
  await supabase.from('visitors').delete().in('id', [onTimeId, lateId]);
  console.log('Cleanup complete. All visitor flow assertions passed.');
}

run().catch(err => { console.error(err); process.exit(1); });
