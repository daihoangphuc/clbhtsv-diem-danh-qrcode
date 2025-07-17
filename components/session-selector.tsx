"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase, type Session } from "@/lib/supabase"
import { Plus, Calendar, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SessionSelectorProps {
  selectedSession: Session | null
  onSessionSelect: (session: Session) => void
  showDeleteButton?: boolean
}

export function SessionSelector({ selectedSession, onSessionSelect, showDeleteButton = true }: SessionSelectorProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newSessionName, setNewSessionName] = useState("")
  const [newSessionDescription, setNewSessionDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    const { data, error } = await supabase.from("sessions").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading sessions:", error)
    } else {
      setSessions(data || [])
      // Tự động chọn buổi đầu tiên nếu chưa có buổi nào được chọn
      if (data && data.length > 0 && !selectedSession) {
        onSessionSelect(data[0])
      }
    }
  }

  const createSession = async () => {
    if (!newSessionName.trim()) return

    setLoading(true)

    // Tự động tạo tên phiên với thời gian Việt Nam
    const now = new Date()
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000) // UTC+7

    const dateStr = vietnamTime.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    const timeStr = vietnamTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    const sessionName = `${newSessionName.trim()} - ${dateStr} ${timeStr}`

    const { data, error } = await supabase
      .from("sessions")
      .insert([
        {
          name: sessionName,
          description: newSessionDescription.trim() || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tạo buổi điểm danh",
        variant: "destructive",
      })
    } else {
      setSessions([data, ...sessions])
      onSessionSelect(data)
      setNewSessionName("")
      setNewSessionDescription("")
      setIsCreateOpen(false)
      toast({
        title: "Thành công",
        description: "Đã tạo buổi điểm danh mới",
      })
    }
    setLoading(false)
  }

  const deleteSession = async (sessionId: string, sessionName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa buổi "${sessionName}"?\nTất cả dữ liệu điểm danh sẽ bị xóa vĩnh viễn.`)) {
      return
    }

    setDeleteLoading(sessionId)

    const { error } = await supabase.from("sessions").delete().eq("id", sessionId)

    if (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa buổi điểm danh",
        variant: "destructive",
      })
    } else {
      setSessions(sessions.filter((s) => s.id !== sessionId))
      if (selectedSession?.id === sessionId) {
        onSessionSelect(sessions.find((s) => s.id !== sessionId) || null)
      }
      toast({
        title: "Thành công",
        description: "Đã xóa buổi điểm danh",
      })
    }
    setDeleteLoading(null)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Chọn buổi điểm danh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Buổi hiện tại</Label>
          <Select
            value={selectedSession?.id || ""}
            onValueChange={(value) => {
              const session = sessions.find((s) => s.id === value)
              if (session) onSessionSelect(session)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn buổi điểm danh" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{session.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Plus className="w-4 h-4 mr-2" />
                Tạo buổi mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo buổi điểm danh mới</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                💡 Hệ thống sẽ tự động thêm ngày giờ hiện tại (giờ Việt Nam) vào tên phiên
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-name">Tên buổi *</Label>
                  <Input
                    id="session-name"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="VD: Buổi học Lập trình Web"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-description">Mô tả</Label>
                  <Input
                    id="session-description"
                    value={newSessionDescription}
                    onChange={(e) => setNewSessionDescription(e.target.value)}
                    placeholder="VD: Lớp IT01 - Phòng A101"
                  />
                </div>
                <Button onClick={createSession} disabled={loading || !newSessionName.trim()} className="w-full">
                  {loading ? "Đang tạo..." : "Tạo buổi"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {showDeleteButton && selectedSession && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => deleteSession(selectedSession.id, selectedSession.name)}
              disabled={deleteLoading === selectedSession.id}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {selectedSession && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="font-medium text-green-800">{selectedSession.name}</p>
            {selectedSession.description && <p className="text-sm text-green-600">{selectedSession.description}</p>}
          </div>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p>Chưa có buổi điểm danh nào</p>
            <p className="text-sm">Tạo buổi đầu tiên để bắt đầu</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
