import { createClient } from "@supabase/supabase-js";

// Retrieve Supabase URL and Anon Key from environment variables.
// Use placeholder fallbacks during local development if credentials are not yet configured.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
