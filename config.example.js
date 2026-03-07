// Configuration Template
// Copy this to config.js and fill in your values
// Then include config.js in budget_app.html before other scripts

window.SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
}

// Usage in budget_app.html:
// Replace:
//   const SUPABASE_URL = 'YOUR_SUPABASE_URL'
//   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
// With:
//   const SUPABASE_URL = window.SUPABASE_CONFIG.url
//   const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG.anonKey
