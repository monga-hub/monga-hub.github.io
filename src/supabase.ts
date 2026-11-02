import { createClient } from '@supabase/supabase-js';

// Public config. The publishable key is meant to ship in the browser: what it can reach is
// limited by Row Level Security (supabase/schema.sql).
export const SUPABASE_URL = 'https://dlvwczxlnqswfehfpzuy.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_NESdfC9tzQfEhMF1vtaxdQ_vGYmm0bU';

// Read before the client consumes it: the confirmation / recovery link lands here with
// `#access_token=…&type=signup|recovery` or `#error=…&error_description=…`.
export const urlHash = new URLSearchParams(location.hash.slice(1));

// Implicit flow (not PKCE) so a confirmation or reset link also works when opened on another
// device than the one that asked for it. The session lives in this origin's localStorage, so
// every game under https://monga-hub.github.io/ sees the same login.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: 'implicit' },
});
