// Supabase client for TanStack Start + Lovable preview.
// Keep this file SSR-safe: it can be imported on the server.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const getEnv = (viteKey: string, nodeKey: string) => {
  // Vite replaces import.meta.env on client/build. process.env is available during SSR.
  return (import.meta.env?.[viteKey] as string | undefined) || process.env[nodeKey];
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL', 'SUPABASE_URL');
const SUPABASE_PUBLISHABLE_KEY = getEnv(
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
) || getEnv('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Set SUPABASE_URL plus SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY or VITE_SUPABASE_URL plus VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY.',
  );
}

// Lovable preview can run inside iframes where navigator.locks is blocked.
// Supabase supports a custom lock; this one serializes auth operations in memory.
const memoryLocks = new Map<string, Promise<unknown>>();
const inMemoryLock = async <T>(name: string, _acquireTimeout: number, fn: () => Promise<T>): Promise<T> => {
  const previous = memoryLocks.get(name) ?? Promise.resolve();
  const next = previous.then(fn, fn);
  memoryLocks.set(name, next.catch(() => undefined));
  return next;
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: typeof window !== 'undefined',
    lock: inMemoryLock,
  },
});
