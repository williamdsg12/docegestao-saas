import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Export as a property that is only initialized when variables are available
// Export the client directly. It will use the environment variables if present.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
