"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase, type Session } from "@/lib/supabase"
import { BarChart3, Calendar, Clock, Users, TrendingUp } from "lucide-react"

interface StatisticsData {
  totalSessions: number
  totalAttendance: number
  todayAttendance: number
  averagePerSession: number
  recentSessions: (Session & { attendance_count: number })[]
  selectedSessionStats?: {
    attendance_count: number
    attendance_list: any[]
  }
}

export function StatisticsDashboard() {
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")

  useEffect(() => {
    loadSessions()
    loadStatistics()
  }, [])

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionStats(selectedSessionId)
    }
  }, [selectedSessionId])

  const loadSessions = async () => {
    const { data, error } = await supabase.from("sessions").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading sessions:", error)
    } else {
      setSessions(data || [])
    }
  }

  const loadSessionStats = async (sessionId: string) => {
    const { data: attendance, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("session_id", sessionId)
      .order("scanned_at", { ascending: false })

    if (error) {
      console.error("Error loading session stats:", error)
    } else {
      setStats((prev) => ({
        ...prev!,
        selectedSessionStats: {
          attendance_count: attendance?.length || 0,
          attendance_list: attendance || [],
        },
      }))
    }
  }

  const loadStatistics = async () => {
    setLoading(true)
    try {
      // Get total sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false })

      if (sessionsError) throw sessionsError

      // Get total attendance
      const { data: attendance, error: attendanceError } = await supabase.from("attendance").select("*")

      if (attendanceError) throw attendanceError

      // Get today's attendance (Vietnam time)
      const now = new Date()
      const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      const today = vietnamTime.toISOString().split("T")[0]

      const { data: todayAttendance, error: todayError } = await supabase
        .from("attendance")
        .select("*")
        .gte("scanned_at", `${today}T00:00:00`)
        .lt("scanned_at", `${today}T23:59:59`)

      if (todayError) throw todayError

      // Get recent sessions with attendance count
      const { data: recentSessions, error: recentError } = await supabase
        .from("sessions")
        .select(`
          *,
          attendance(count)
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      const processedRecentSessions =
        recentSessions?.map((session: any) => ({
          ...session,
          attendance_count: session.attendance?.[0]?.count || 0,
        })) || []

      setStats({
        totalSessions: sessions?.length || 0,
        totalAttendance: attendance?.length || 0,
        todayAttendance: todayAttendance?.length || 0,
        averagePerSession: sessions?.length ? Math.round((attendance?.length || 0) / sessions.length) : 0,
        recentSessions: processedRecentSessions,
      })
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">Đang tải thống kê...</CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center text-red-500">Không thể tải thống kê</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall Statistics */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Thống kê tổng quan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600">Tổng buổi</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">{stats.totalSessions}</div>
            </div>

            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Tổng điểm danh</span>
              </div>
              <div className="text-2xl font-bold text-green-800">{stats.totalAttendance}</div>
            </div>

            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-600">Hôm nay</span>
              </div>
              <div className="text-2xl font-bold text-orange-800">{stats.todayAttendance}</div>
            </div>

            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-600">TB/buổi</span>
              </div>
              <div className="text-2xl font-bold text-purple-800">{stats.averagePerSession}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session-specific Statistics */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Thống kê theo buổi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chọn buổi để xem chi tiết</Label>
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn buổi điểm danh" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {stats.selectedSessionStats && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Số lượt điểm danh:</span>
                <Badge variant="secondary">{stats.selectedSessionStats.attendance_count}</Badge>
              </div>

              {stats.selectedSessionStats.attendance_list.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-600">Danh sách:</p>
                  {stats.selectedSessionStats.attendance_list.map((record, index) => (
                    <div key={record.id} className="text-xs p-2 bg-white rounded border">
                      <div className="flex justify-between items-center">
                        <span>#{index + 1}</span>
                        <span className="text-gray-500">
                          {new Date(record.scanned_at).toLocaleString("vi-VN", {
                            timeZone: "Asia/Ho_Chi_Minh",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {record.student_name && <p className="text-green-600 font-medium">{record.student_name}</p>}
                      {record.student_id && <p className="text-blue-600">{record.student_id}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">Buổi gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentSessions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Chưa có buổi điểm danh nào</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{session.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">{session.attendance_count} người</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
