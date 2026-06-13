export function hasSupabaseConfig() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function missingSupabaseKeys() {
  return [
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL ? null : "SUPABASE_URL",
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? null : "SUPABASE_ANON_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY ? null : "SUPABASE_SERVICE_ROLE_KEY"
  ].filter(Boolean) as string[];
}
