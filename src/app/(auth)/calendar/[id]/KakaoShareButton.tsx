'use client'
import { useEffect, useRef } from 'react'

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
  const initialized = useRef(false)

  useEffect(() => {
    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init('a0158adb0822ae2bd038e0321530c574')
        initialized.current = true
      }
    }

    if (window.Kakao) {
      initKakao()
    } else {
      const script = document.createElement('script')
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
      script.async = true
      script.onload = initKakao
      document.head.appendChild(script)
    }
  }, [])

  const handleShare = () => {
    if (!window.Kakao) return
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init('a0158adb0822ae2bd038e0321530c574')
    }
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
    <button
      onClick={handleShare}
      aria-label="카카오톡 공유"
      className="flex items-center justify-center w-9 h-9 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-full transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.698 5.417 4.268 6.933L5.5 21l3.75-2.25C10.007 19.578 11 19.75 12 19.75c5.523 0 10-3.477 10-7.75S17.523 3 12 3z"/>
      </svg>
    </button>
  )
}
