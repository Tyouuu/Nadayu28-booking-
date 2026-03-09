import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase project URL and anon key
// from https://supabase.com/dashboard -> Settings -> API
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Auth helpers ─────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(
  email: string,
  password: string,
  metadata: { full_name: string; role: string; unit?: string; phone?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) return { data, error };

  // Update profile with unit + phone (trigger only sets full_name + role)
  if (data.user && (metadata.unit || metadata.phone)) {
    await supabase
      .from('profiles')
      .update({ unit: metadata.unit, phone: metadata.phone })
      .eq('id', data.user.id);
  }
  return { data, error };
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}
