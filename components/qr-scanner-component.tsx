"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QRScanner } from "@/lib/qr-scanner"
import { Camera, CameraOff, CheckCircle, Volume2, VolumeX } from "lucide-react"

interface QRScannerComponentProps {
  onScan: (result: string) => void
  isActive: boolean
  onToggle: () => void
}

export function QRScannerComponent({ onScan, isActive, onToggle }: QRScannerComponentProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QRScanner | null>(null)
  const [error, setError] = useState<string>("")
  const [lastScannedContent, setLastScannedContent] = useState<string>("") // Renamed for clarity
  const [scanSuccess, setScanSuccess] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [scanCount, setScanCount] = useState(0)

  // Create beep sound using Web Audio API
  const playBeepSound = () => {
    if (!soundEnabled) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime) // High-pitched beep
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.15)
    } catch (error) {
      console.warn("Could not play beep sound:", error)
    }
  }

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new QRScanner()
    }

    if (isActive && videoRef.current) {
      setError("")
      scannerRef.current.startScanning(
        videoRef.current,
        (result) => {
          // This callback is now only triggered by QRScanner when a unique/cooldown-passed code is found
          setLastScannedContent(result)
          setScanSuccess(true)
          setScanCount((prev) => prev + 1)

          playBeepSound() // Play beep sound immediately

          onScan(result) // Call parent callback to save to DB

          // Show success feedback for 1.5 seconds
          setTimeout(() => setScanSuccess(false), 1500)
        },
        (error) => {
          setError(`Lỗi camera: ${error.message}`)
        },
      )
    } else {
      scannerRef.current?.stopScanning()
    }

    return () => {
      scannerRef.current?.stopScanning()
    }
  }, [isActive, onScan, soundEnabled]) // Removed lastScanned from dependencies as it's handled internally by QRScanner

  // Reset states when scanner is turned off
  useEffect(() => {
    if (!isActive) {
      setScanCount(0)
      setLastScannedContent("")
      setScanSuccess(false)
    }
  }, [isActive])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Scanner Display */}
          <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-gray-400">
                  <Camera className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-sm">Nhấn để bật camera</p>
                </div>
              </div>
            )}

            {/* Scanner Overlay */}
            {isActive && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner brackets */}
                <div className="absolute inset-8">
                  <div className="relative w-full h-full border-2 border-transparent">
                    {/* Top-left corner */}
                    <div className="absolute top-0 left-0 w-8 h-8">
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 animate-pulse"></div>
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 animate-pulse"></div>
                    </div>

                    {/* Top-right corner */}
                    <div className="absolute top-0 right-0 w-8 h-8">
                      <div className="absolute top-0 right-0 w-full h-1 bg-blue-400 animate-pulse"></div>
                      <div className="absolute top-0 right-0 w-1 h-full bg-blue-400 animate-pulse"></div>
                    </div>

                    {/* Bottom-left corner */}
                    <div className="absolute bottom-0 left-0 w-8 h-8">
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-400 animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-1 h-full bg-blue-400 animate-pulse"></div>
                    </div>

                    {/* Bottom-right corner */}
                    <div className="absolute bottom-0 right-0 w-8 h-8">
                      <div className="absolute bottom-0 right-0 w-full h-1 bg-blue-400 animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-1 h-full bg-blue-400 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Animated scanning line */}
                <div className="absolute inset-8">
                  <div className="relative w-full h-full overflow-hidden">
                    <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-scan-line shadow-lg shadow-red-400/50"></div>
                  </div>
                </div>

                {/* Center target */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-red-400 rounded-full animate-ping"></div>
                  <div className="absolute w-2 h-2 bg-red-400 rounded-full"></div>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <p className="text-white text-sm font-medium">Hướng camera vào QR code</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs">Đã quét: {scanCount} mã</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success feedback with prominent display */}
            {scanSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/95 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-300">
                <div className="text-center text-white">
                  <div className="relative mb-4">
                    <CheckCircle className="w-24 h-24 mx-auto animate-bounce" />
                    <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-white rounded-full animate-ping"></div>
                  </div>
                  <p className="font-bold text-xl mb-2">OK!</p>
                  <p className="text-sm opacity-75 mt-2">Đã lưu điểm <data value=""></data>anh</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button onClick={onToggle} className="flex-1" variant={isActive ? "destructive" : "default"}>
              {isActive ? (
                <>
                  <CameraOff className="w-4 h-4 mr-2" />
                  Tắt camera
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Bật camera
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? "bg-green-50 border-green-200" : "bg-gray-50"}
              title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-green-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          </div>

          {/* Status Display */}
          {isActive && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Trạng thái quét:</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600">Đang hoạt động</span>
                </div>
              </div>
              <div className="text-xs text-blue-600">
                <p>
                  • Đã quét: <strong>{scanCount}</strong> mã QR
                </p>
                <p>
                  • Âm thanh: <strong>{soundEnabled ? "Bật" : "Tắt"}</strong>
                </p>
                <p>• Mỗi mã chỉ được quét 1 lần trong {`2 giây`}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
              <p className="text-xs text-red-500 mt-1">Vui lòng cho phép truy cập camera và thử lại</p>
            </div>
          )}

          {lastScannedContent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                QR cuối cùng đã quét:
              </p>
              <p className="text-xs text-green-700 font-mono break-all mt-1 bg-white p-2 rounded border">
                {lastScannedContent}
              </p>
              <p className="text-xs text-green-600 mt-1">✅ Đã lưu vào cơ sở dữ liệu</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
