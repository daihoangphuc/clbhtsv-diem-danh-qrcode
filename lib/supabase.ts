import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Session = {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export type Attendance = {
  id: string
  session_id: string
  qr_content: string
  scanned_at: string
  student_name?: string
  student_id?: string
  additional_info?: any
}
