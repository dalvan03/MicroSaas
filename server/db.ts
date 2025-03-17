// server-copy/db.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl) throw new Error('supabaseUrl is required.');
if (!supabaseKey) throw new Error('supabaseAnonKey is required.');

export const supabase = createClient(supabaseUrl, supabaseKey);

