'use client'

export default function QRDisplay({ url }: { url: string }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}`

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl">
      <img src={qrUrl} alt="QR Code" width={280} height={280} />
    </div>
  )
}
