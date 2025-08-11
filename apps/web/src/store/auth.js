import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getCurrentUser, onAuthStateChange, getStoredSession } from '../lib/auth';
// Debounce function to prevent rapid state changes
function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
export const useAuthStore = create()(devtools((set, get) => ({
    user: null,
    loading: true,
    initialized: false,
    sessionChecked: false,
    setUser: (user) => {
        console.log('[Auth Store] Setting user:', user?.id || 'null');
        set({ user, loading: false });
    },
    setLoading: (loading) => set({ loading }),
    initialize: async () => {
        // Prevent multiple initializations
        if (get().initialized) {
            console.log('[Auth Store] Already initialized, skipping...');
            return;
        }
        set({ initialized: true });
        console.log('[Auth Store] Starting initialization...');
        try {
            // Step 1: Check for stored session first (synchronous)
            const storedSession = await getStoredSession();
            if (storedSession) {
                console.log('[Auth Store] Found stored session, validating...');
                // We have a stored session, but we still need to validate it
                // and get the full user data
            }
            else {
                console.log('[Auth Store] No stored session found');
            }
            // Step 2: Set up auth state listener BEFORE checking current user
            // This prevents race conditions
            let listenerReady = false;
            const debouncedStateChange = debounce(async (user) => {
                if (!listenerReady)
                    return; // Ignore events until we're ready
                console.log('[Auth Store] Auth state changed (debounced):', user?.id || 'null');
                set({ user, loading: false, sessionChecked: true });
            }, 100); // 100ms debounce
            const { data: { subscription } } = onAuthStateChange((user) => {
                debouncedStateChange(user);
            });
            get().authSubscription = subscription;
            // Step 3: Now check current user with proper timeout handling
            const timeoutId = setTimeout(() => {
                console.warn('[Auth Store] Auth initialization timed out after 10 seconds');
                set({ user: null, loading: false, sessionChecked: true });
            }, 10000);
            try {
                const user = await getCurrentUser();
                clearTimeout(timeoutId);
                // Mark listener as ready after initial check
                listenerReady = true;
                console.log('[Auth Store] Initial user check completed:', user?.id || 'null');
                set({ user, loading: false, sessionChecked: true });
            }
            catch (error) {
                clearTimeout(timeoutId);
                console.error('[Auth Store] Error during initial user check:', error);
                // Even on error, mark as checked and ready
                listenerReady = true;
                set({ user: null, loading: false, sessionChecked: true });
            }
        }
        catch (error) {
            console.error('[Auth Store] Fatal error during initialization:', error);
            set({ user: null, loading: false, sessionChecked: true });
        }
    },
}), {
    name: 'web-auth-store',
}));
