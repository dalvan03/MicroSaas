import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const supabaseUrl = "https://grkyyaxcdxrwyzrrttad.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdya3l5YXhjZHhyd3l6cnJ0dGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MTkzMTUsImV4cCI6MjA1NzE5NTMxNX0.5GngMNggYdWjPZRHDOfwKRJQuHW1QY4vm5IHO7JMZXs";

export const supabase = createClient(supabaseUrl, supabaseKey);
