import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using the service_role key.
 * This bypasses RLS and should ONLY be used in API routes / server components.
 * NEVER expose the service_role key to the client.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Server-side operations will fail.')
}

export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    })
    : null as any;
