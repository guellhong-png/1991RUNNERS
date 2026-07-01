import { Download } from 'lucide-react'

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']

function getExt(url: string) {
  return url.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
}

// 간단한 리치텍스트 렌더러
// - **볼드** 마크다운 문법
// - ![](url) : 이미지 미리보기
// - [파일명](url) : 이미지면 미리보기, 그 외엔 다운로드 버튼
export function RichText({ content, className }: { content: string; className?: string }) {
  const lines = content.split('\n')

  function renderInline(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className={className}>
      {lines.map((line, i) => {
        const trimmed = line.trim()

        // ![](url) 이미지
        const imgMatch = trimmed.match(/^!\[\]\((.+)\)$/)
        if (imgMatch) {
          return <img key={i} src={imgMatch[1]} alt="" className="rounded-lg w-full object-contain mt-2 mb-2" />
        }

        // [파일명](url) 첨부파일
        const fileMatch = trimmed.match(/^\[([^\]]+)\]\((.+)\)$/)
        if (fileMatch) {
          const [, name, url] = fileMatch
          const ext = getExt(url)
          if (IMAGE_EXTS.includes(ext)) {
            return (
              <div key={i} className="mt-2 mb-2">
                <p className="text-xs text-gray-400 mb-1">{name}</p>
                <img src={url} alt={name} className="rounded-lg w-full object-contain" />
              </div>
            )
          }
          return (
            <div key={i} className="mt-2 mb-1">
              <a href={url} download={name} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                <Download size={14} />
                {name}
                <span className="text-xs text-gray-400 uppercase">{ext}</span>
              </a>
            </div>
          )
        }

        return (
          <p key={i} className={trimmed === '' ? 'h-3' : ''}>
            {renderInline(line)}
          </p>
        )
      })}
    </div>
  )
}
