import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lwjchzfzepjhhooyreye.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8KH3rUwI-w9D8TaBqclV6A_EC7S4Rh3';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
