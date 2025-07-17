"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase, type Attendance, type Session } from "@/lib/supabase"
import { exportToExcel } from "@/lib/excel-export"
import { Download, Users, Clock } from "lucide-react"

interface AttendanceListProps {
  session: Session | null
  refreshTrigger: number
  filterText?: string
}

export function AttendanceList({ session, refreshTrigger, filterText = "" }: AttendanceListProps) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) {
      loadAttendance()
    }
  }, [session, refreshTrigger])

  const loadAttendance = async () => {
    if (!session) return

    setLoading(true)
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("session_id", session.id)
      .order("scanned_at", { ascending: false })

    if (error) {
      console.error("Error loading attendance:", error)
    } else {
      setAttendance(data || [])
    }
    setLoading(false)
  }

  const handleExport = () => {
    if (session && attendance.length > 0) {
      exportToExcel(attendance, session.name)
    }
  }

  if (!session) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center text-gray-500">Vui lòng chọn buổi điểm danh</CardContent>
      </Card>
    )
  }

  // Lọc danh sách theo filterText
  const filteredAttendance = attendance.filter(record =>
    record.qr_content.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Danh sách điểm danh
          </div>
          <Badge variant="secondary">{filteredAttendance.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredAttendance.length > 0 && (
          <Button onClick={handleExport} className="w-full bg-transparent" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
        )}

        {loading ? (
          <div className="text-center py-4">Đang tải...</div>
        ) : filteredAttendance.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Chưa có ai điểm danh</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAttendance.map((record, index) => (
              <div key={record.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">#{filteredAttendance.length - index}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(record.scanned_at).toLocaleString("vi-VN", {
                      timeZone: "Asia/Ho_Chi_Minh",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-mono bg-white p-2 rounded border text-xs break-all">{record.qr_content}</p>
                  {record.student_name && (
                    <p className="mt-1 text-green-600">
                      <strong>Tên:</strong> {record.student_name}
                    </p>
                  )}
                  {record.student_id && (
                    <p className="text-blue-600">
                      <strong>MSSV:</strong> {record.student_id}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
