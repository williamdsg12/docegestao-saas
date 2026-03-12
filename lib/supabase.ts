import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Export as a function to ensure it doesn't crash during build-time static evaluation
// if environment variables are missing.
// Export the client directly. It will use the environment variables if present.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
