import { useState, useEffect, useCallback } from 'react'
import { FileText, X, Eye, Pencil, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/sessions/MarkdownRenderer'
import { useFileViewerStore } from '@/stores/useFileViewerStore'
import { toast } from '@/lib/toast'
import { useI18n } from '@/i18n'

interface WorktreeContextEditorProps {
  worktreeId: string
}

export function WorktreeContextEditor({
  worktreeId
}: WorktreeContextEditorProps): React.JSX.Element {
  const { tr } = useI18n()
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const hasUnsavedChanges = content !== savedContent

  // Load context on mount
  useEffect(() => {
    let cancelled = false

    void (async () => {
      setIsLoading(true)
      try {
        const result = await window.worktreeOps.getContext(worktreeId)
        if (cancelled) return
        const ctx = result.success ? (result.context ?? '') : ''
        setContent(ctx)
        setSavedContent(ctx)
        // Default to edit mode when content is empty
        if (!ctx) {
          setIsEditing(true)
        }
      } catch {
        if (!cancelled) {
          toast.error(tr('Failed to load worktree context', '加载工作树上下文失败'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [worktreeId, tr])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const result = await window.worktreeOps.updateContext(worktreeId, content || null)
      if (result.success) {
        setSavedContent(content)
        toast.success(tr('Context saved', '上下文已保存'))
      } else {
        toast.error(result.error || tr('Failed to save context', '保存上下文失败'))
      }
    } catch {
      toast.error(tr('Failed to save context', '保存上下文失败'))
    } finally {
      setIsSaving(false)
    }
  }, [worktreeId, content, tr])

  // Save on Cmd+S / Ctrl+S
  useEffect(() => {
    if (!isEditing) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges && !isSaving) {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, hasUnsavedChanges, isSaving, handleSave])

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        tr('You have unsaved changes. Discard them?', '你有未保存的更改。要放弃它们吗？')
      )
      if (!confirmed) return
    }
    useFileViewerStore.getState().closeContextEditor()
  }, [hasUnsavedChanges, tr])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
        {/* Left: icon + title + unsaved indicator */}
        <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" />
        <span className="text-sm font-bold">{tr('Worktree Context', '工作树上下文')}</span>
        {hasUnsavedChanges && isEditing && (
          <span
            className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
            title={tr('Unsaved changes', '未保存的更改')}
          />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Toggle buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant={!isEditing ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setIsEditing(false)}
          >
            <Eye className="h-3.5 w-3.5" />
            {tr('Preview', '预览')}
          </Button>
          <Button
            variant={isEditing ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {tr('Edit', '编辑')}
          </Button>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-accent transition-colors"
          title={tr('Close', '关闭')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              tr(
                'Enter worktree context here. This markdown will be injected into the first prompt of each new AI session.\n\nExample:\n## Feature: User Authentication\n- Working on login/signup flow\n- Backend API at /api/auth\n- Using JWT tokens',
                '在这里输入工作树上下文。该 Markdown 会注入到每个新 AI 会话的第一条提示中。\n\n示例：\n## 功能：用户认证\n- 正在开发登录/注册流程\n- 后端 API 位于 /api/auth\n- 使用 JWT 令牌'
              )
            }
            className="w-full h-full resize-none bg-transparent font-mono text-sm p-4 focus:outline-none"
          />
        ) : content ? (
          <div className="p-4 text-sm">
            <MarkdownRenderer content={content} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground px-8 text-center">
            {tr(
              'No worktree context set. Click Edit to add context that will be injected into AI sessions.',
              '尚未设置工作树上下文。点击“编辑”可添加会注入到 AI 会话中的上下文。'
            )}
          </div>
        )}
      </div>

      {/* Footer with save button — only in edit mode */}
      {isEditing && (
        <div className="flex items-center justify-end px-4 py-2 border-t border-border bg-muted/30">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {tr('Save Context', '保存上下文')}
          </Button>
        </div>
      )}
    </div>
  )
}
