// scripts/verify-documents-rls.mjs
// Run with: node --env-file=.env scripts/verify-documents-rls.mjs
import { createClient } from '@supabase/supabase-js';

function assert(cond, msg) {
  if (!cond) throw new Error('FAILED: ' + msg);
  console.log('OK: ' + msg);
}

const RESIDENT_EMAIL = process.env.VERIFY_RESIDENT_EMAIL;
const RESIDENT_PASSWORD = process.env.VERIFY_RESIDENT_PASSWORD;

async function run() {
  const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: signInError } = await client.auth.signInWithPassword({
    email: RESIDENT_EMAIL, password: RESIDENT_PASSWORD,
  });
  if (signInError) throw signInError;

  const { data: readRows, error: readError } = await client.from('documents').select('*');
  if (readError) throw readError;
  assert(true, `RESIDENT can read documents without an RLS error (${readRows.length} rows visible)`);

  const { error: insertError } = await client.from('documents').insert({
    id: 'dtest' + Date.now(),
    title: 'Should not insert',
    category: 'Other',
    file_path: 'x',
    file_name: 'x',
    uploaded_by_name: 'Test',
  });
  assert(!!insertError, 'RESIDENT insert into documents is rejected by RLS');

  console.log('\nAll documents RLS assertions passed.');
}

run().catch(err => { console.error(err); process.exit(1); });
