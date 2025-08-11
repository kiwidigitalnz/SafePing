import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'safeping-auth-token',
        flowType: 'pkce', // Use PKCE flow for better security
    },
    global: {
        headers: {
            'x-client-info': 'safeping-web',
        },
    },
    db: {
        schema: 'public',
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});
// Add connection state monitoring
let connectionRetries = 0;
const MAX_RETRIES = 3;
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
        console.log('[Supabase] Token refreshed successfully');
        connectionRetries = 0;
    }
    else if (event === 'SIGNED_OUT') {
        console.log('[Supabase] User signed out');
        connectionRetries = 0;
    }
    else if (event === 'USER_UPDATED') {
        console.log('[Supabase] User data updated');
    }
});
// Monitor for network issues
window.addEventListener('online', () => {
    console.log('[Supabase] Network connection restored');
    // Attempt to refresh session when coming back online
    supabase.auth.refreshSession().catch(err => {
        console.error('[Supabase] Failed to refresh session after reconnect:', err);
    });
});
window.addEventListener('offline', () => {
    console.log('[Supabase] Network connection lost');
});
