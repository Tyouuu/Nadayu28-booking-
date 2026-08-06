// scripts/verify-audit-rls.mjs
// Run with: node --env-file=.env scripts/verify-audit-rls.mjs
import { createClient } from '@supabase/supabase-js';

function assert(cond, msg) {
  if (!cond) throw new Error('FAILED: ' + msg);
  console.log('OK: ' + msg);
}

const RESIDENT_EMAIL = process.env.VERIFY_RESIDENT_EMAIL;
const RESIDENT_PASSWORD = process.env.VERIFY_RESIDENT_PASSWORD;
const MANAGEMENT_EMAIL = process.env.VERIFY_MANAGEMENT_EMAIL;
const MANAGEMENT_PASSWORD = process.env.VERIFY_MANAGEMENT_PASSWORD;

async function run() {
  // MANAGEMENT: should see at least one row (Task 4/5's manual test already wrote some).
  const mgmtClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: mgmtSignInError } = await mgmtClient.auth.signInWithPassword({
    email: MANAGEMENT_EMAIL, password: MANAGEMENT_PASSWORD,
  });
  if (mgmtSignInError) throw mgmtSignInError;
  const { data: mgmtRows, error: mgmtError } = await mgmtClient.from('audit_log').select('*');
  if (mgmtError) throw mgmtError;
  assert(mgmtRows.length > 0, `MANAGEMENT can read audit_log (${mgmtRows.length} rows visible)`);

  // MANAGEMENT can also read all profiles (needed for the Users tab).
  const { data: mgmtProfiles, error: mgmtProfilesError } = await mgmtClient.from('profiles').select('*');
  if (mgmtProfilesError) throw mgmtProfilesError;
  assert(mgmtProfiles.length > 1, `MANAGEMENT can read all profiles (${mgmtProfiles.length} rows visible)`);

  // RESIDENT: RLS should return zero rows, not an error.
  const residentClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: residentSignInError } = await residentClient.auth.signInWithPassword({
    email: RESIDENT_EMAIL, password: RESIDENT_PASSWORD,
  });
  if (residentSignInError) throw residentSignInError;
  const { data: residentRows, error: residentError } = await residentClient.from('audit_log').select('*');
  if (residentError) throw residentError;
  assert(residentRows.length === 0, 'RESIDENT reads audit_log and gets zero rows (RLS blocks it)');

  // RESIDENT should also only see their own profile, not everyone's.
  const { data: residentProfiles, error: residentProfilesError } = await residentClient.from('profiles').select('*');
  if (residentProfilesError) throw residentProfilesError;
  assert(residentProfiles.length === 1, `RESIDENT reads profiles and only sees their own row (${residentProfiles.length} row(s))`);

  console.log('\nAll audit RLS assertions passed.');
}

run().catch(err => { console.error(err); process.exit(1); });
