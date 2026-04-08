import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function setup() {
  console.log('Creating "invoices" bucket...')
  const { data, error } = await supabase.storage.createBucket('invoices', {
    public: false,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    fileSizeLimit: 5242880 // 5MB
  })

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket "invoices" already exists.')
    } else {
      console.error('Error creating bucket:', error.message)
    }
  } else {
    console.log('Bucket "invoices" created successfully!')
  }
}

setup()
