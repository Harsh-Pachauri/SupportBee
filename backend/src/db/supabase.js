import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase environment variables are not fully configured yet.');
}

let realtimeTransport;

if (!globalThis.WebSocket) {
  try {
    const wsModule = await import('ws');
    realtimeTransport = wsModule.default ?? wsModule;
  } catch {
    console.warn(
      'Supabase realtime transport is unavailable on Node < 22 without `ws`. ' +
      'Install `ws` (npm install ws) or upgrade Node to 22+.'
    );
  }
}

let supabaseClient = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      realtime: realtimeTransport ? { transport: realtimeTransport } : undefined,
    });
  } catch (err) {
    console.warn('Supabase client initialization failed:', err.message || err);
  }
}

export const supabase = supabaseClient;
