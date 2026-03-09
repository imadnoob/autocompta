import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate URL format
const isValidUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// Check if running in demo mode
export const isDemoMode = !isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key';

// Create a mock client for demo mode - no console errors
const createMockClient = (): any => {
    const demoError = { error: { message: 'Demo mode - configure .env.local for full functionality' } };

    return {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => demoError,
            signUp: async () => demoError,
            signOut: async () => ({ error: null }),
            onAuthStateChange: (_event: any, _callback: any) => ({
                data: { subscription: { unsubscribe: () => { } } }
            }),
        },
        from: (_table: string) => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
            delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
            eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
            order: () => Promise.resolve({ data: [], error: null }),
            filter: () => ({ data: [], error: null }),
            limit: () => ({ data: [], error: null }),
        }),
        storage: {
            from: (_bucket: string) => ({
                upload: async () => demoError,
                download: async () => demoError,
                getPublicUrl: () => ({ data: { publicUrl: '' } }),
            })
        },
        channel: (_name: string) => ({
            on: () => ({ subscribe: () => ({ unsubscribe: () => { } }) }),
            subscribe: () => ({ unsubscribe: () => { } }),
        })
    };
};

let supabase: SupabaseClient | ReturnType<typeof createMockClient>;

if (!isDemoMode) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Log once at startup only
    if (typeof window === 'undefined') {
        console.log('🎭 Running in DEMO MODE - Configure .env.local for production');
    }
    supabase = createMockClient();
}

export { supabase };
