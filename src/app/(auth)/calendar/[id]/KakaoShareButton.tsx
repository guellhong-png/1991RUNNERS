'use client'
import { useEffect } from 'react'

interface Props {
  title: string
  description: string
  imageUrl?: string | null
  eventId: string
}

declare global {
  interface Window {
    Kakao: any
  }
}

export default function KakaoShareButton({ title, description, imageUrl, eventId }: Props) {
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('a0158adb0822ae2bd038e0321530c574')
    }
  }, [])

  const handleShare = () => {
    if (!window.Kakao) return
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `🏃 ${title}`,
        description,
        imageUrl: imageUrl || 'https://kvotmnyktvgqlplfbuqh.supabase.co/storage/v1/object/public/club-images/1991.jpeg',
        link: {
          mobileWebUrl: `https://1991-runners.vercel.app/calendar/${eventId}`,
          webUrl: `https://1991-runners.vercel.app/calendar/${eventId}`,
        },
      },
      buttons: [
        {
          title: '모임 보기',
          link: {
            mobileWebUrl: `https://1991-runners.vercel.app/calendar/${eventId}`,
            webUrl: `https://1991-runners.vercel.app/calendar/${eventId}`,
          },
        },
      ],
    })
  }

  return (
    <>
      <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" async />
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs font-medium rounded-lg transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.698 5.417 4.268 6.933L5.5 21l3.75-2.25C10.007 19.578 11 19.75 12 19.75c5.523 0 10-3.477 10-7.75S17.523 3 12 3z"/>
        </svg>
        카카오톡 공유
      </button>
    </>
  )
}
