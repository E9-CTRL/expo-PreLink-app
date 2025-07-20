// 📁 supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ffynaiwwgynylehlqxpr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmeW5haXd3Z3luZ2xlaGxxeHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzOTMzMjEsImV4cCI6MjA2Nzk2OTMyMX0.AsVhCNwQMMdzzFLQyOg_lF60UcDu5EYaw_AxwTG - rc4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
