import * as XLSX from "xlsx"
import type { Attendance } from "./supabase"

export function exportToExcel(attendance: Attendance[], sessionName: string) {
  const data = attendance.map((record, index) => ({
    STT: index + 1,
    "Mã sinh viên": record.student_id || "N/A",
    "Tên sinh viên": record.student_name || "N/A",
    "Nội dung QR": record.qr_content,
    "Thời gian quét": new Date(record.scanned_at).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, "Điểm danh")

  // Tạo tên file với thời gian Việt Nam
  const now = new Date()
  const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const dateStr = vietnamTime.toISOString().split("T")[0]

  const fileName = `Diem_danh_${sessionName.replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
