import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://mynblrqjnrxgmmawehil.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bmJscnFqbnJ4Z21tYXdlaGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTkzMzgsImV4cCI6MjA2NzkzNTMzOH0.gD1PxMA18OL05kgoQrRHRqBCBQ3jxA0ZQUcREmq_1fA';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };