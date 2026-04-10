import { useState } from 'react'
import { Bug, Copy } from 'lucide-react'
import { toast } from 'sonner'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem
} from '@/components/ui/context-menu'
import { ToolCallDebugModal } from './ToolCallDebugModal'
import type { ToolUseInfo } from './ToolCard'
import { useI18n } from '@/i18n/useI18n'

interface ToolCallContextMenuProps {
  children: React.ReactNode
  toolUse: ToolUseInfo
}

export function ToolCallContextMenu({ children, toolUse }: ToolCallContextMenuProps) {
  const { tr } = useI18n()
  const [debugOpen, setDebugOpen] = useState(false)

  const handleCopyCommand = async () => {
    let textToCopy = ''

    // Extract command/pattern based on tool type
    const lowerName = toolUse.name.toLowerCase()
    const isTodoWrite = lowerName.includes('todowrite') || lowerName.includes('todo_write')

    if (lowerName.includes('bash') || lowerName.includes('shell') || lowerName.includes('exec')) {
      textToCopy = (toolUse.input.command || toolUse.input.cmd || '') as string
    } else if (lowerName.includes('grep') || lowerName.includes('search')) {
      textToCopy = (toolUse.input.pattern ||
        toolUse.input.query ||
        toolUse.input.regex ||
        '') as string
    } else if (lowerName.includes('glob') || lowerName.includes('find')) {
      textToCopy = (toolUse.input.pattern || toolUse.input.glob || '') as string
    } else if (
      !isTodoWrite &&
      (lowerName.includes('read') || lowerName.includes('write') || lowerName.includes('edit'))
    ) {
      textToCopy = (toolUse.input.filePath ||
        toolUse.input.file_path ||
        toolUse.input.path ||
        '') as string
    } else if (lowerName === 'webfetch' || lowerName === 'web_fetch') {
      textToCopy = (toolUse.input.url || '') as string
    } else {
      // Fallback: copy entire input as JSON
      textToCopy = JSON.stringify(toolUse.input, null, 2)
    }

    if (!textToCopy.trim()) {
      toast.error(tr('Nothing to copy', '没有可复制的内容'))
      return
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      toast.success(tr('Copied to clipboard', '已复制到剪贴板'))
    } catch {
      toast.error(tr('Failed to copy', '复制失败'))
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleCopyCommand} className="gap-2">
            <Copy className="h-3.5 w-3.5" />
            {tr('Copy Details', '复制详情')}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setDebugOpen(true)} className="gap-2">
            <Bug className="h-3.5 w-3.5" />
            {tr('Inspect Tool Call', '检查工具调用')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <ToolCallDebugModal open={debugOpen} onOpenChange={setDebugOpen} toolUse={toolUse} />
    </>
  )
}
