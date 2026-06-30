'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Download, Heart, MessageCircle, Plus, Check } from 'lucide-react'
import GpxUploadModal from './GpxUploadModal'

declare global {
  interface Window { kakao: any }
}

interface Route {
  id: string
  title: string
  description: string | null
  distance: number | null
  duration: number | null
  avg_pace: number | null
  elevation_gain: number | null
  elevation_loss: number | null
  elevation_profile: string | null
  activity_type: string
  gpx_url: string | null
  polyline: string | null
  created_at: string
  author: { id: string; name: string; avatar_url?: string }
  likes: { user_id: string }[]
  comments: { id: string }[]
}

const ACTIVITY_LABELS: Record<string, string> = {
  run: '🏃 로드',
  trail: '🏔️ 트레일',
}

const ACTIVITY_COLORS: Record<string, string> = {
  run: 'bg-blue-50 text-blue-700',
  trail: 'bg-purple-50 text-purple-700',
}

const handleDownload = (url: string, title: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = `${title}.gpx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

let kakaoScriptPromise: Promise<void> | null = null
const loadKakaoSdk = (): Promise<void> => {
  if (kakaoScriptPromise) return kakaoScriptPromise
  kakaoScriptPromise = new Promise((resolve) => {
    if (window.kakao?.maps) { resolve(); return }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=a0158adb0822ae2bd038e0321530c574&autoload=false`
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
  return kakaoScriptPromise
}

const RouteMap = ({ polyline, routeId }: { polyline: string; routeId: string }) => {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const coords: [number, number][] = JSON.parse(polyline)
    if (coords.length < 2) return

    loadKakaoSdk().then(() => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return
        const center = coords[Math.floor(coords.length / 2)]
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(center[0], center[1]),
          level: 5,
        })

        const path = coords.map(c => new window.kakao.maps.LatLng(c[0], c[1]))

        new window.kakao.maps.Polyline({
          map,
          path,
          strokeWeight: 4,
          strokeColor: '#c0392b',
          strokeOpacity: 0.9,
          strokeStyle: 'solid',
        })

        new window.kakao.maps.Marker({
          map,
          position: path[0],
        })

        const bounds = new window.kakao.maps.LatLngBounds()
        path.forEach(p => bounds.extend(p))
        map.setBounds(bounds)
      })
    })
  }, [polyline])

  return <div ref={mapRef} className="w-full rounded-xl overflow-hidden" style={{ height: 220 }} />
}

const ElevationChart = ({
  elevationProfile,
  gain,
  loss,
  distance,
}: {
  elevationProfile: string
  gain: number | null
  loss: number | null
  distance: number | null
}) => {
  const eles: number[] = JSON.parse(elevationProfile)
  if (eles.length < 2) return null

  const padL = 38
  const padR = 10
  const padT = 12
  const padB = 28
  const H = 140

  const minEle = Math.min(...eles)
  const maxEle = Math.max(...eles)
  const range = maxEle - minEle || 1

  // viewBox를 100으로 정규화해서 실제 컨테이너 너비에 맞게 자동 스케일
  const VW = 100
  const chartW = VW - padL - padR
  const chartH = H - padT - padB

  const toX = (i: number) => padL + (i / (eles.length - 1)) * chartW
  const toY = (e: number) => padT + chartH - ((e - minEle) / range) * chartH

  const points = eles.map((e, i) => `${toX(i).toFixed(2)},${toY(e).toFixed(2)}`).join(' ')
  const areaPoints = `${toX(0).toFixed(2)},${(padT + chartH).toFixed(2)} ${points} ${toX(eles.length - 1).toFixed(2)},${(padT + chartH).toFixed(2)}`

  const yTickCount = 4
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const val = minEle + (range * i) / yTickCount
    return { val, y: toY(val) }
  })

  const totalDist = distance ?? 0
  const xTickCount = 5
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => {
    const ratio = i / xTickCount
    const idx = Math.round(ratio * (eles.length - 1))
    const label = totalDist > 0
      ? `${(totalDist * ratio).toFixed(1)}`
      : `${Math.round(ratio * 100)}%`
    return { x: toX(idx), label }
  })

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1 px-0.5">
        <p className="text-xs font-medium text-gray-500">고도 프로필</p>
        <div className="flex gap-3 text-xs text-gray-400">
          <span>최저 <span className="font-semibold text-gray-600">{Math.round(minEle)}m</span></span>
          <span>최고 <span className="font-semibold text-gray-600">{Math.round(maxEle)}m</span></span>
          {gain != null && <span className="text-green-600">↑{gain}m</span>}
          {loss != null && <span className="text-blue-500">↓{loss}m</span>}
        </div>
      </div>
      <div className="w-full">
        <svg
          viewBox={`0 0 ${VW} ${H}`}
          preserveAspectRatio="none"
          className="w-full rounded-lg bg-gray-50 border border-gray-100"
          style={{ height: 130, display: 'block' }}
        >
          {/* Y축 그리드 + 레이블 */}
          {yTicks.map(({ val, y }, i) => (
            <g key={i}>
              <line
                x1={padL} y1={y.toFixed(2)}
                x2={VW - padR} y2={y.toFixed(2)}
                stroke="#e5e7eb" strokeWidth="0.4"
                strokeDasharray={i === 0 ? undefined : '1.5,1.5'}
              />
              <text
                x={padL - 1.5} y={y.toFixed(2)}
                textAnchor="end" dominantBaseline="middle"
                fontSize="4.5" fill="#9ca3af"
              >
                {Math.round(val)}
              </text>
            </g>
          ))}

          {/* 면적 채우기 */}
          <polygon points={areaPoints} fill="#fecaca" fillOpacity="0.5" />

          {/* 라인 */}
          <polyline
            points={points}
            fill="none"
            stroke="#c0392b"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X축 베이스라인 */}
          <line
            x1={padL} y1={padT + chartH}
            x2={VW - padR} y2={padT + chartH}
            stroke="#9ca3af" strokeWidth="0.4"
          />

          {/* Y축 베이스라인 */}
          <line
            x1={padL} y1={padT}
            x2={padL} y2={padT + chartH}
            stroke="#9ca3af" strokeWidth="0.4"
          />

          {/* X축 틱 + 레이블 */}
          {xTicks.map(({ x, label }, i) => (
            <g key={i}>
              <line
                x1={x.toFixed(2)} y1={padT + chartH}
                x2={x.toFixed(2)} y2={(padT + chartH + 2).toFixed(2)}
                stroke="#9ca3af" strokeWidth="0.4"
              />
              <text
                x={x.toFixed(2)} y={H - 6}
                textAnchor={i === 0 ? 'start' : i === xTickCount ? 'end' : 'middle'}
                fontSize="4.5" fill="#9ca3af"
              >
                {label}
              </text>
            </g>
          ))}

          {/* X축 단위 레이블 */}
          {totalDist > 0 && (
            <text x={VW - padR} y={H - 1} textAnchor="end" fontSize="3.5" fill="#c0392b">
              km
            </text>
          )}
          {/* Y축 단위 레이블 */}
          <text x={padL + 1} y={padT - 2} textAnchor="start" fontSize="3.5" fill="#c0392b">
            m
          </text>
        </svg>
      </div>
    </div>
  )
}

export default function GpxFeed({ routes: initialRoutes, userId }: { routes: Route[]; userId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [routes, setRoutes] = useState(initialRoutes)
  const [showUpload, setShowUpload] = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [loadingLike, setLoadingLike] = useState<string | null>(null)

  const handleLike = async (routeId: string) => {
    setLoadingLike(routeId)
    const route = routes.find(r => r.id === routeId)
    const isLiked = route?.likes.some(l => l.user_id === userId)
    if (isLiked) {
      await supabase.from('gpx_likes').delete().eq('route_id', routeId).eq('user_id', userId)
      setRoutes(routes.map(r => r.id === routeId ? { ...r, likes: r.likes.filter(l => l.user_id !== userId) } : r))
    } else {
      await supabase.from('gpx_likes').insert({ route_id: routeId, user_id: userId })
      setRoutes(routes.map(r => r.id === routeId ? { ...r, likes: [...r.likes, { user_id: userId }] } : r))
    }
    setLoadingLike(null)
  }

  const loadComments = async (routeId: string) => {
    const { data } = await supabase
      .from('gpx_comments')
      .select('*, author:profiles!user_id(name, avatar_url)')
      .eq('route_id', routeId)
      .order('created_at', { ascending: true })
    setComments(prev => ({ ...prev, [routeId]: data ?? [] }))
  }

  const toggleComments = async (routeId: string) => {
    const next = !showComments[routeId]
    setShowComments(prev => ({ ...prev, [routeId]: next }))
    if (next && !comments[routeId]) await loadComments(routeId)
  }

  const handleComment = async (routeId: string) => {
    const content = commentInputs[routeId]?.trim()
    if (!content) return
    await supabase.from('gpx_comments').insert({ route_id: routeId, user_id: userId, content })
    setCommentInputs(prev => ({ ...prev, [routeId]: '' }))
    await loadComments(routeId)
    setRoutes(routes.map(r => r.id === routeId ? { ...r, comments: [...r.comments, { id: 'new' }] } : r))
  }

  const handleUploadComplete = () => {
    setShowUpload(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setShowUpload(true)}
        className="w-full py-3 bg-[#c0392b] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#a93226] transition-colors"
      >
        <Plus size={18} />
        GPX 업로드
      </button>

      {routes.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🏃</p>
          <p className="text-gray-400">아직 등록된 코스가 없어요</p>
          <p className="text-gray-400 text-sm mt-1">첫 번째 GPX를 업로드해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map(route => {
            const isLiked = route.likes.some(l => l.user_id === userId)
            return (
              <div key={route.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#c0392b] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                    {route.author?.avatar_url
                      ? <img src={route.author.avatar_url} className="w-full h-full object-cover" />
                      : route.author?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{route.author?.name}</p>
                    <p className="text-xs text-gray-400">{format(new Date(route.created_at), 'M월 d일 HH:mm', { locale: ko })}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTIVITY_COLORS[route.activity_type] || 'bg-gray-100 text-gray-600'}`}>
                    {ACTIVITY_LABELS[route.activity_type] || route.activity_type}
                  </span>
                </div>

                <p className="font-bold text-gray-900 mb-3">{route.title}</p>

                {route.polyline && (
                  <div className="mb-3">
                    <RouteMap polyline={route.polyline} routeId={route.id} />
                  </div>
                )}

                {route.elevation_profile && (
                  <ElevationChart
                    elevationProfile={route.elevation_profile}
                    gain={route.elevation_gain}
                    loss={route.elevation_loss}
                    distance={route.distance}
                  />
                )}

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {route.distance != null && (
                    <div>
                      <p className="text-base font-bold text-gray-900">{route.distance.toFixed(2)} km</p>
                      <p className="text-xs text-gray-400">거리</p>
                    </div>
                  )}
                  {route.elevation_gain != null && (
                    <div>
                      <p className="text-base font-bold text-gray-900">↑ {route.elevation_gain} m</p>
                      <p className="text-xs text-gray-400">총 상승</p>
                    </div>
                  )}
                  {route.elevation_loss != null && (
                    <div>
                      <p className="text-base font-bold text-gray-900">↓ {route.elevation_loss} m</p>
                      <p className="text-xs text-gray-400">총 하강</p>
                    </div>
                  )}
                </div>

                {route.description && (
                  <p className="text-sm text-gray-500 mb-3">{route.description}</p>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  {route.gpx_url && (
                    <button
                      onClick={() => handleDownload(route.gpx_url!, route.title)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg flex-1 justify-center hover:bg-gray-700 transition-colors"
                    >
                      <Download size={14} />
                      GPX 다운로드
                    </button>
                  )}
                  <button
                    onClick={() => handleLike(route.id)}
                    disabled={loadingLike === route.id}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isLiked ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} />
                    {route.likes.length}
                  </button>
                  <button
                    onClick={() => toggleComments(route.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <MessageCircle size={14} />
                    {route.comments.length}
                  </button>
                </div>

                {showComments[route.id] && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {(comments[route.id] ?? []).map((c: any) => (
                      <div key={c.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                          {c.author?.avatar_url
                            ? <img src={c.author.avatar_url} className="w-full h-full object-cover" />
                            : c.author?.name?.[0]}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-xs font-medium text-gray-700">{c.author?.name}</p>
                          <p className="text-xs text-gray-600">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={commentInputs[route.id] ?? ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [route.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleComment(route.id)}
                        placeholder="댓글 입력..."
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#c0392b]"
                      />
                      <button
                        onClick={() => handleComment(route.id)}
                        className="px-3 py-2 bg-[#c0392b] text-white rounded-lg text-sm hover:bg-[#a93226] transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showUpload && (
        <GpxUploadModal
          userId={userId}
          onClose={() => setShowUpload(false)}
          onComplete={handleUploadComplete}
        />
      )}
    </>
  )
}
