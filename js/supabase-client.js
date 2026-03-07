/**
 * Supabase client initialization
 * Replace these values with your Supabase project credentials
 */

// Initialize Supabase client
// You'll need to replace these with your actual Supabase URL and anon key
const SUPABASE_URL = window.SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Initialize Supabase client (will be loaded from CDN)
let supabase = null

async function initSupabase() {
  if (typeof supabaseClient !== 'undefined') {
    supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    return supabase
  }
  
  // If supabase-js is loaded via script tag
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    return supabase
  }
  throw new Error('Supabase client library not loaded. Please include supabase-js script.')
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.initSupabase = initSupabase
  window.getSupabase = () => supabase
}
