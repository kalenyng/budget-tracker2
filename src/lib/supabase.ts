import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://vydlgnxwqvkrrlkdhzfh.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZGxnbnh3cXZrcnJsa2RoemZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDk5ODYsImV4cCI6MjA4ODI4NTk4Nn0.C9B6t3ddpJhucgn_FIiDNOnmNmldfIb1KIv3CvQJCLw'

console.log('[DEBUG] Supabase Config:', {
  url: SUPABASE_URL,
  keyPrefix: SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY
})

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test connection on import
if (typeof window !== 'undefined') {
  console.log('[DEBUG] Supabase client created:', !!supabase)
  
  // Test query
  supabase.from('categories').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('[DEBUG] Supabase connection error:', error)
      } else {
        console.log('[DEBUG] Supabase connection successful!', data)
      }
    })
    .catch(err => {
      console.error('[DEBUG] Supabase connection failed:', err)
    })
}
