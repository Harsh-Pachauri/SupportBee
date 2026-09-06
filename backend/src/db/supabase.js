import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.'
  );
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

const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  realtime: realtimeTransport ? { transport: realtimeTransport } : undefined,
});

export const supabase = supabaseClient;
