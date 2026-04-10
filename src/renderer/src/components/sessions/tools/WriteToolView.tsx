import { useState, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToolViewProps } from './types'
import { getPrismLanguage } from '@/lib/language-map'
import { useI18n } from '@/i18n/useI18n'

const MAX_PREVIEW_LINES = 20


export function WriteToolView({ input, error }: ToolViewProps) {
  const { tr } = useI18n()
  const [showAll, setShowAll] = useState(false)

  const filePath = (input.file_path || input.filePath || input.path || '') as string
  const content = (input.content || '') as string

  const language = useMemo(() => (filePath ? getPrismLanguage(filePath) : 'text'), [filePath])

  if (error) {
    return (
      <div className="text-red-400 font-mono text-xs whitespace-pre-wrap break-all">{error}</div>
    )
  }

  if (!content) return null

  const lines = content.split('\n')
  const needsTruncation = lines.length > MAX_PREVIEW_LINES
  const displayedContent = showAll ? content : lines.slice(0, MAX_PREVIEW_LINES).join('\n')

  return (
    <div data-testid="write-tool-view">
      {/* Syntax-highlighted code block */}
      <div className="rounded-md overflow-hidden">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          showLineNumbers
          startingLineNumber={1}
          wrapLines
          customStyle={{
            margin: 0,
            borderRadius: '0.375rem',
            fontSize: '12px',
            lineHeight: '18px',
            padding: '8px 0'
          }}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#52525b',
            userSelect: 'none'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-mono)'
            }
          }}
        >
          {displayedContent}
        </SyntaxHighlighter>
      </div>

      {/* Show all button */}
      {needsTruncation && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
          data-testid="show-all-button"
        >
          <ChevronDown
            className={cn('h-3 w-3 transition-transform duration-150', showAll && 'rotate-180')}
          />
          {showAll
            ? tr('Show less', '收起')
            : tr(`Show all ${lines.length} lines`, `显示全部 ${lines.length} 行`)}
        </button>
      )}
    </div>
  )
}
