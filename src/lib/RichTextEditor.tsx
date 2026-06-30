'use client'
import { useRef } from 'react'
import { Bold } from 'lucide-react'

// 간단한 볼드 토글이 가능한 텍스트 에디터
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function toggleBold() {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end)

    if (selected.length === 0) {
      const next = value.slice(0, start) + '****' + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(start + 2, start + 2)
      })
      return
    }

    const isAlreadyBold = selected.startsWith('**') && selected.endsWith('**') && selected.length > 4
    let next: string
    let newStart: number
    let newEnd: number

    if (isAlreadyBold) {
      const unwrapped = selected.slice(2, -2)
      next = value.slice(0, start) + unwrapped + value.slice(end)
      newStart = start
      newEnd = start + unwrapped.length
    } else {
      const wrapped = '**' + selected + '**'
      next = value.slice(0, start) + wrapped + value.slice(end)
      newStart = start
      newEnd = start + wrapped.length
    }

    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(newStart, newEnd)
    })
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-2 border border-gray-200 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={toggleBold}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          title="볼드 (선택 후 클릭)"
        >
          <Bold size={16} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="input resize-none"
      />
      <p className="text-xs text-gray-400 mt-1">텍스트를 선택하고 B 버튼을 누르면 굵게 표시돼요</p>
    </div>
  )
}
