import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewrerrqeyoupatjcfdrv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cmVycnFleW91cGF0amNmZHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Nzg0NDYsImV4cCI6MjA4MDU1NDQ0Nn0.okLGUQTqgIqy3Ke5l8B2U7if1L4b3FylhxdnY1iiz80';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);