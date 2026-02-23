import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

let client: ReturnType<typeof supabaseCreateClient> | null = null;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  client = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
    realtime: { params: { eventsPerSecond: 0 } },
    auth: { persistSession: true },
  });

  return client;
}
