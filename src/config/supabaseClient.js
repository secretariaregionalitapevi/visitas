const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('SUPABASE credentials not set. supabase client may not work. Set SUPABASE_URL and SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '', {
  auth: { persistSession: false }
});

module.exports = supabase;
