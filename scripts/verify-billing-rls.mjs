// scripts/verify-billing-rls.mjs
// Run with: node --env-file=.env scripts/verify-billing-rls.mjs
import { createClient } from '@supabase/supabase-js';

function assert(cond, msg) {
  if (!cond) throw new Error('FAILED: ' + msg);
  console.log('OK: ' + msg);
}

const RESIDENT_EMAIL = process.env.VERIFY_RESIDENT_EMAIL;
const RESIDENT_PASSWORD = process.env.VERIFY_RESIDENT_PASSWORD;
const RESIDENT_UNIT = process.env.VERIFY_RESIDENT_UNIT;
const MANAGEMENT_EMAIL = process.env.VERIFY_MANAGEMENT_EMAIL;
const MANAGEMENT_PASSWORD = process.env.VERIFY_MANAGEMENT_PASSWORD;
const OTHER_UNIT = process.env.VERIFY_OTHER_UNIT || 'A-12-05';

async function run() {
  const mgmtClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: mgmtSignInError } = await mgmtClient.auth.signInWithPassword({
    email: MANAGEMENT_EMAIL, password: MANAGEMENT_PASSWORD,
  });
  if (mgmtSignInError) throw mgmtSignInError;

  // MANAGEMENT can set a fee schedule for the resident's unit.
  const { error: setErr } = await mgmtClient.from('fee_schedules').upsert({ unit: RESIDENT_UNIT, monthly_amount: 150 });
  if (setErr) throw setErr;
  assert(true, `MANAGEMENT can write fee_schedules for ${RESIDENT_UNIT}`);

  const residentClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: residentSignInError } = await residentClient.auth.signInWithPassword({
    email: RESIDENT_EMAIL, password: RESIDENT_PASSWORD,
  });
  if (residentSignInError) throw residentSignInError;

  // RESIDENT cannot write to fee_schedules (RLS blocks the write itself).
  const { error: residentWriteErr } = await residentClient.from('fee_schedules').upsert({ unit: RESIDENT_UNIT, monthly_amount: 999 });
  assert(!!residentWriteErr, 'RESIDENT is blocked from writing fee_schedules');

  // Idempotency: call ensure_invoices_for_unit 3 times, expect exactly one row for this unit+period.
  for (let i = 0; i < 3; i++) {
    const { error } = await mgmtClient.rpc('ensure_invoices_for_unit', { p_unit: RESIDENT_UNIT });
    if (error) throw error;
  }
  const period = new Date().toISOString().slice(0, 7);
  const { data: invoices, error: fetchErr } = await mgmtClient
    .from('invoices').select('*').eq('unit', RESIDENT_UNIT).eq('period', period);
  if (fetchErr) throw fetchErr;
  assert(invoices.length === 1, `ensure_invoices_for_unit is idempotent (${invoices.length} row after 3 calls)`);

  // RESIDENT can read their own unit's invoice.
  const { data: ownInvoices, error: ownErr } = await residentClient.from('invoices').select('*').eq('unit', RESIDENT_UNIT);
  if (ownErr) throw ownErr;
  assert(ownInvoices.length >= 1, `RESIDENT can read own unit invoices (${ownInvoices.length} row(s))`);

  // RESIDENT cannot see another unit's invoices (RLS filters them out silently).
  const { data: otherInvoices, error: otherErr } = await residentClient.from('invoices').select('*').eq('unit', OTHER_UNIT);
  if (otherErr) throw otherErr;
  assert(otherInvoices.length === 0, `RESIDENT cannot see ${OTHER_UNIT}'s invoices`);

  // MANAGEMENT can see all invoices (at least the one just generated).
  const { data: allInvoices, error: allErr } = await mgmtClient.from('invoices').select('*');
  if (allErr) throw allErr;
  assert(allInvoices.length >= 1, `MANAGEMENT can read all invoices (${allInvoices.length} row(s) visible)`);

  console.log('\nAll billing RLS assertions passed.');
}

run().catch(err => { console.error(err); process.exit(1); });
