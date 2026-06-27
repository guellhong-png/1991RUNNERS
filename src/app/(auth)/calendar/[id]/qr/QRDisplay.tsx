'use client'
import { useEffect, useRef } from 'react'

export default function QRDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const loadQR = async () => {
      const QRCode = (await import('qrcode')).default
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, url, {
          width: 280,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        })
      }
    }
    loadQR()
  }, [url])

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl">
      <canvas ref={canvasRef} />
    </div>
  )
}
