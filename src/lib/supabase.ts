import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cbggntmqnulzdhpmying.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ2dudG1xbnVsemRocG15aW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Njk5MjUsImV4cCI6MjA4ODA0NTkyNX0.Ean-9TvMQaIoeJpO3VNwHt8ddwN8loj2C9lSa6uIcEM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
