"use client"

import { useState, useCallback } from "react"
import { QRScannerComponent } from "@/components/qr-scanner-component"
import { SessionSelector } from "@/components/session-selector"
import { AttendanceList } from "@/components/attendance-list"
import { supabase, type Session } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { QrCode, Users, Settings, BarChart3 } from "lucide-react"
import { StatisticsDashboard } from "@/components/statistics-dashboard"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export default function HomePage() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isScannerActive, setIsScannerActive] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [filterText, setFilterText] = useState("")

  const handleQRScan = useCallback(
    async (qrContent: string) => {
      if (!selectedSession) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn buổi điểm danh trước",
          variant: "destructive",
        })
        return
      }

      try {
        // Check if this QR code already exists in this session to prevent database duplicates
        const { data: existingAttendance, error: checkError } = await supabase
          .from("attendance")
          .select("id")
          .eq("session_id", selectedSession.id)
          .eq("qr_content", qrContent)
          .limit(1)

        if (checkError) {
          throw checkError
        }

        if (existingAttendance && existingAttendance.length > 0) {
          toast({
            title: "Đã điểm danh",
            description: "QR code này đã được quét trong buổi này rồi",
            variant: "destructive",
          })
          return
        }

        // Parse QR content if it's JSON (for student info)
        let studentName = null
        let studentId = null
        let additionalInfo = null

        try {
          const parsed = JSON.parse(qrContent)
          if (parsed.name) studentName = parsed.name
          if (parsed.id) studentId = parsed.id
          if (parsed.info) additionalInfo = parsed.info
        } catch {
          // QR content is not JSON, treat as plain text
        }

        const { error } = await supabase.from("attendance").insert([
          {
            session_id: selectedSession.id,
            qr_content: qrContent,
            student_name: studentName,
            student_id: studentId,
            additional_info: additionalInfo,
          },
        ])

        if (error) {
          toast({
            title: "Lỗi",
            description: "Không thể lưu điểm danh: " + error.message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Thành công",
            description: `Đã điểm danh thành công! ${studentName ? `(${studentName})` : ""}`,
          })
          setRefreshTrigger((prev) => prev + 1)
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi xử lý QR code",
          variant: "destructive",
        })
      }
    },
    [selectedSession],
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Card className="mb-4">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <QrCode className="w-8 h-8 text-blue-600" />
              Điểm danh QR
            </CardTitle>
          </CardHeader>
        </Card>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scan" className="flex items-center gap-1">
              <QrCode className="w-4 h-4" />
              Quét
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Danh sách
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Thống kê
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <SessionSelector selectedSession={selectedSession} onSessionSelect={setSelectedSession} />

            {selectedSession && (
              <QRScannerComponent
                onScan={handleQRScan}
                isActive={isScannerActive}
                onToggle={() => setIsScannerActive(!isScannerActive)}
              />
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <SessionSelector selectedSession={selectedSession} onSessionSelect={setSelectedSession} />
            {selectedSession && (
              <input
                type="text"
                placeholder="Lọc theo mã sinh viên..."
                className="w-full p-2 border rounded mb-2"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
              />
            )}
            {selectedSession && (
              <AttendanceList session={selectedSession} refreshTrigger={refreshTrigger} filterText={filterText} />
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <StatisticsDashboard />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SessionSelector selectedSession={selectedSession} onSessionSelect={setSelectedSession} />
          </TabsContent>
        </Tabs>
      </div>
      <PWAInstallPrompt />
    </div>
  )
}
