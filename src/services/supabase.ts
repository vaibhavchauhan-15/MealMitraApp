import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL ='https://kvuzqrrzeugpzffbyyep.supabase.co';
const SUPABASE_ANON_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dXpxcnJ6ZXVncHpmZmJ5eWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNDUxMDMsImV4cCI6MjA4ODYyMTEwM30.huUyzlEXwCOSozgRk8j38952nR1ZQWBAZmW5Ywh8Xrc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
