-- Tạo bảng sessions (buổi điểm danh)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng attendance (điểm danh)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  qr_content TEXT NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  student_name VARCHAR(255),
  student_id VARCHAR(100),
  additional_info JSONB
);

-- Tạo index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_scanned_at ON attendance(scanned_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
