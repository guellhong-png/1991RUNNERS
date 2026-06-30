// 간단한 리치텍스트 렌더러: **볼드** 마크다운 문법 + ![](url) 이미지 + 줄바꿈 문단 지원
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
        const imageMatch = line.trim().match(/^!\[\]\((.+)\)$/)
        if (imageMatch) {
          return <img key={i} src={imageMatch[1]} alt="" className="rounded-lg w-full object-contain mt-2" />
        }
        return (
          <p key={i} className={line.trim() === '' ? 'h-3' : ''}>
            {renderInline(line)}
          </p>
        )
      })}
    </div>
  )
}
