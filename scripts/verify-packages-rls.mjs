// scripts/verify-packages-rls.mjs
// Run with: node --env-file=.env scripts/verify-packages-rls.mjs
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

  const testId = 'pkg-verify-' + Date.now();
  const { error: insertErr } = await mgmtClient.from('packages').insert({
    id: testId, unit: RESIDENT_UNIT, description: 'Test package', courier: 'Test Courier',
    received_by_name: 'Verify Script',
  });
  if (insertErr) throw insertErr;
  assert(true, `MANAGEMENT can log a package for ${RESIDENT_UNIT}`);

  const residentClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: residentSignInError } = await residentClient.auth.signInWithPassword({
    email: RESIDENT_EMAIL, password: RESIDENT_PASSWORD,
  });
  if (residentSignInError) throw residentSignInError;

  const { error: residentWriteErr } = await residentClient.from('packages').insert({
    id: 'pkg-should-fail', unit: RESIDENT_UNIT, received_by_name: 'Resident',
  });
  assert(!!residentWriteErr, 'RESIDENT is blocked from writing packages');

  const { data: ownPackages, error: ownErr } = await residentClient.from('packages').select('*').eq('unit', RESIDENT_UNIT);
  if (ownErr) throw ownErr;
  assert(ownPackages.some(p => p.id === testId), `RESIDENT can read own unit packages (found test package)`);

  const { data: otherPackages, error: otherErr } = await residentClient.from('packages').select('*').eq('unit', OTHER_UNIT);
  if (otherErr) throw otherErr;
  assert(otherPackages.length === 0, `RESIDENT cannot see ${OTHER_UNIT}'s packages`);

  const { error: collectErr } = await mgmtClient.from('packages').update({
    status: 'collected', collected_at: new Date().toISOString(), collected_by_name: 'Verify Script',
  }).eq('id', testId);
  if (collectErr) throw collectErr;
  const { data: collected } = await mgmtClient.from('packages').select('status').eq('id', testId).single();
  assert(collected.status === 'collected', 'MANAGEMENT can mark a package collected');

  console.log('\nAll package RLS assertions passed.');
}

run().catch(err => { console.error(err); process.exit(1); });
