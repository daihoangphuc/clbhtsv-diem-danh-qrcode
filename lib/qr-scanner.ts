"use client"

import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat, type Result } from "@zxing/library"

export class QRScanner {
  private codeReader: BrowserMultiFormatReader
  private stream: MediaStream | null = null
  private isScanning = false
  private lastScanTime = 0
  private scanCooldown = 2000 // 2 seconds cooldown between scans for the same QR code
  private lastScannedCode = "" // Stores the content of the last successfully scanned QR code

  constructor() {
    // Configure the reader to specifically look for QR codes and try harder
    this.codeReader = new BrowserMultiFormatReader(
      null,
      new Map([
        [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
        [DecodeHintType.TRY_HARDER, true],
      ]),
    )
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    onResult: (result: string) => void,
    onError: (error: Error) => void,
  ) {
    try {
      // Stop any existing scanning
      this.stopScanning()

      // Reset last scanned code when starting new session
      this.lastScannedCode = ""
      this.lastScanTime = 0

      // Get camera stream with optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
      })

      this.stream = stream
      videoElement.srcObject = stream
      this.isScanning = true

      // Wait for video to be ready
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = resolve
      })

      await videoElement.play()

      // Start continuous scanning
      this.scanContinuously(videoElement, onResult, onError)
    } catch (error) {
      onError(error as Error)
    }
  }

  private scanContinuously(
    videoElement: HTMLVideoElement,
    onResult: (result: string) => void,
    onError: (error: Error) => void,
  ) {
    if (!this.isScanning) return

    this.codeReader
      .decodeOnceFromVideoDevice(undefined, videoElement)
      .then((result: Result) => {
        if (result && this.isScanning) {
          const qrCode = result.getText()
          const now = Date.now()

          // Logic to prevent duplicate scans from the scanner itself:
          // 1. If the scanned code is different from the last one, process it.
          // 2. If it's the same code, only process it if enough time has passed (cooldown).
          if (qrCode !== this.lastScannedCode || now - this.lastScanTime > this.scanCooldown) {
            this.lastScannedCode = qrCode // Update the last successfully processed code
            this.lastScanTime = now // Update the last successful scan time
            onResult(qrCode) // Trigger callback
          }
        }
      })
      .catch((error) => {
        // Ignore NotFoundException (no QR code found in frame) and continue scanning
        if (error.name !== "NotFoundException" && this.isScanning) {
          onError(error) // Pass other errors to the component
        }
      })
      .finally(() => {
        // Continue scanning after a short interval
        if (this.isScanning) {
          setTimeout(() => this.scanContinuously(videoElement, onResult, onError), 200)
        }
      })
  }

  stopScanning() {
    this.isScanning = false
    this.lastScannedCode = "" // Reset for next session
    this.lastScanTime = 0 // Reset for next session

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    this.codeReader.reset()
  }
}
