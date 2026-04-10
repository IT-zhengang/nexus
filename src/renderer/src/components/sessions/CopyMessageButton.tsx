import { useState, memo } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useI18n } from '@/i18n/useI18n'

interface CopyMessageButtonProps {
  content: string
}

export const CopyMessageButton = memo(function CopyMessageButton({ content }: CopyMessageButtonProps) {
  const { tr } = useI18n()
  const [copied, setCopied] = useState(false)

  if (!content.trim()) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success(tr('Copied to clipboard', '已复制到剪贴板'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(tr('Failed to copy', '复制失败'))
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 backdrop-blur-sm"
      aria-label={tr('Copy message', '复制消息')}
      data-testid="copy-message-button"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </Button>
  )
})
