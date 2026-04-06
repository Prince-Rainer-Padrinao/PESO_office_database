import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jobwsdfbeyegxlbxxzto.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYndzZGZiZXllZ3hsYnh4enRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjQ3ODEsImV4cCI6MjA5MTAwMDc4MX0.38zGm0qBKYaNVOejjK4pqp2KfMme3enj7BtqfHcKkjI'

export const supabase = createClient(supabaseUrl, supabaseKey)