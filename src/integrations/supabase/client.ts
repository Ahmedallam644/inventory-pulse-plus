import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rckeujbbmmqzyshqrcxa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJja2V1amJibW1xenlzaHFyY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzIzNDYsImV4cCI6MjA2NTc0ODM0Nn0.sb_publishable_VS7jF5c-1EzFCMft35xH7A_VgoUs1J0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
