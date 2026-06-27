'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QrCode, X, Printer } from 'lucide-react'

export default function QRButton({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const supabase = createClient()

  const handleQR = async () => {
    setLoading(true)
    const { data: event } = await supabase.from('events').select('checkin_token').eq('id', eventId).single()
    let token = event?.checkin_token
    if (!token) {
      token = crypto.randomUUID()
      await supabase.from('events').update({ checkin_token: token }).eq('id', eventId)
    }
    const checkinUrl = `https://1991-runners.vercel.app/calendar/checkin/${token}`
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkinUrl)}`
    setQrUrl(qrImageUrl)
    setShowModal(true)
    setLoading(false)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>${eventTitle} - QR 체크인</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; background: white; }
            img { width: 300px; height: 300px; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { color: #666; margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>${eventTitle}</h1>
          <p>QR을 스캔하면 자동으로 출석 체크됩니다</p>
          <br/>
          <img src="${qrUrl}" />
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <>
      <button onClick={handleQR} disabled={loading}
        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
        <QrCode size={18} />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <p className="font-semibold text-gray-900">QR 체크인</p>
                <p className="text-sm text-gray-500 mt-0.5">{eventTitle}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center p-6 gap-4">
              <img src={qrUrl} alt="QR Code" width={280} height={280} className="rounded-xl" />
              <p className="text-sm text-gray-500 text-center">QR을 스캔하면 자동으로 출석 체크됩니다</p>
              <button onClick={handlePrint}
                className="flex items-center gap-2 w-full justify-center py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
                <Printer size={16} />
                인쇄하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
