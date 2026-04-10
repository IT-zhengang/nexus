import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  X,
  Clock,
  Calendar,
  FolderGit2,
  GitBranch,
  Loader2,
  ExternalLink,
  Filter,
  MessageSquare,
  AlertCircle,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useSessionHistoryStore, type SessionWithWorktree } from '@/stores/useSessionHistoryStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useWorktreeStore } from '@/stores/useWorktreeStore'
import { useSessionStore, type Session } from '@/stores/useSessionStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useI18n } from '@/i18n/useI18n'

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Format date for display
function formatDate(dateString: string, tr: (en: string, zh: string) => string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return tr(
      `Today at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
      `今天 ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    )
  } else if (diffDays === 1) {
    return tr(
      `Yesterday at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
      `昨天 ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    )
  } else if (diffDays < 7) {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }
}

// Session list item component
interface SessionItemProps {
  session: SessionWithWorktree
  isSelected: boolean
  isOrphaned: boolean
  onSelect: () => void
  onLoad: () => void
}

function SessionItem({
  session,
  isSelected,
  isOrphaned,
  onSelect,
  onLoad
}: SessionItemProps): React.JSX.Element {
  const { tr } = useI18n()
  return (
    <div
      className={cn(
        'p-3 border-b border-border cursor-pointer transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-muted',
        isOrphaned && 'opacity-60'
      )}
      onClick={onSelect}
      data-testid={`session-item-${session.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Session name */}
          <div className={cn('font-medium text-sm truncate', isOrphaned && 'italic')}>
            {session.name || tr('Untitled Session', '未命名会话')}
          </div>

          {/* Project, worktree, and connection info */}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {session.project_name && (
              <span className="flex items-center gap-1">
                <FolderGit2 className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{session.project_name}</span>
              </span>
            )}
            {session.connection_name && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{session.connection_name}</span>
              </span>
            )}
            {session.worktree_name && (
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{session.worktree_name}</span>
              </span>
            )}
            {isOrphaned && (
              <span className="text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {tr('Archived', '已归档')}
              </span>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(session.updated_at, tr)}
          </div>
        </div>

        {/* Load button - visible on hover/selection */}
        <Button
          variant="ghost"
          size="sm"
          className={cn('opacity-0 transition-opacity', isSelected && 'opacity-100')}
          onClick={(e) => {
            e.stopPropagation()
            onLoad()
          }}
          title={tr('Load session in new tab', '在新标签页中加载会话')}
          data-testid="load-session-button"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function toOrphanedSession(session: SessionWithWorktree): Session {
  return {
    id: session.id,
    worktree_id: session.worktree_id,
    project_id: session.project_id,
    connection_id: session.connection_id,
    name: session.name,
    status: session.status,
    opencode_session_id: session.opencode_session_id,
    agent_sdk: 'opencode',
    mode: 'build',
    model_provider_id: null,
    model_id: null,
    model_variant: null,
    created_at: session.created_at,
    updated_at: session.updated_at,
    completed_at: session.completed_at
  }
}

// Session preview component
interface SessionPreviewProps {
  session: SessionWithWorktree
  onLoad: () => void
}

function SessionPreview({ session, onLoad }: SessionPreviewProps): React.JSX.Element {
  const { tr } = useI18n()
  const getSessionPreviewMessages = useSessionHistoryStore(
    (state) => state.getSessionPreviewMessages
  )
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load messages for preview
  useEffect(() => {
    let cancelled = false
    const loadMessages = async (): Promise<void> => {
      setIsLoading(true)
      try {
        const sessionMessages = await getSessionPreviewMessages(session)
        if (!cancelled) {
          setMessages(sessionMessages)
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setMessages([])
          setIsLoading(false)
        }
      }
    }
    loadMessages()
    return () => {
      cancelled = true
    }
  }, [getSessionPreviewMessages, session])

  const isOrphaned = !session.worktree_id || session.worktree_name === undefined

  return (
    <div
      className="h-full flex flex-col bg-background border-l border-border"
      data-testid="session-preview"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className={cn('font-semibold text-lg', isOrphaned && 'italic opacity-80')}>
          {session.name || tr('Untitled Session', '未命名会话')}
        </h3>
        <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
          {session.project_name && (
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-4 w-4" />
              {session.project_name}
            </div>
          )}
          {session.worktree_name && (
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              {session.worktree_name} ({session.worktree_branch_name})
            </div>
          )}
          {isOrphaned && (
            <div className="flex items-center gap-2 text-amber-500">
              <AlertCircle className="h-4 w-4" />
              {tr("This session's worktree has been archived", '此会话的工作树已归档')}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {tr('Created', '创建于')} {formatDate(session.created_at, tr)}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {tr('Updated', '更新于')} {formatDate(session.updated_at, tr)}
          </div>
        </div>
      </div>

      {/* Messages preview */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          {tr('Messages Preview', '消息预览')}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {tr('No messages in this session', '此会话中没有消息')}
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-2 rounded-lg text-sm',
                  msg.role === 'user' && 'bg-muted/50',
                  msg.role === 'assistant' && 'bg-primary/10',
                  msg.role === 'system' && 'bg-yellow-500/10'
                )}
              >
                <div className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                  {msg.role}
                </div>
                <p className="line-clamp-3">{msg.content}</p>
              </div>
            ))}
            {messages.length >= 5 && (
              <p className="text-xs text-muted-foreground text-center">
                {tr('...and more messages', '……还有更多消息')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border">
        <Button onClick={onLoad} className="w-full" data-testid="load-session-preview-button">
          <ExternalLink className="h-4 w-4 mr-2" />
          {tr('Load Session', '加载会话')}
        </Button>
      </div>
    </div>
  )
}

// Empty state component
function EmptyState({ hasFilters }: { hasFilters: boolean }): React.JSX.Element {
  const { tr } = useI18n()
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <Clock className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
      <h3 className="font-medium text-lg mb-2">{tr('No sessions found', '未找到会话')}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {hasFilters
          ? tr(
              'Try adjusting your search filters to find more sessions.',
              '尝试调整搜索筛选条件以找到更多会话。'
            )
          : tr(
              'Start working in a worktree to create your first session.',
              '在工作树中开始工作以创建你的第一个会话。'
            )}
      </p>
    </div>
  )
}

// Main SessionHistory component
export function SessionHistory(): React.JSX.Element | null {
  const { tr } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)

  // Stores
  const {
    isOpen,
    filters,
    searchResults,
    isSearching,
    error,
    selectedSessionId,
    closePanel,
    setKeyword,
    setProjectFilter,
    setWorktreeFilter,
    setDateFromFilter,
    setDateToFilter,
    setIncludeArchived,
    clearFilters,
    performSearch,
    selectSession
  } = useSessionHistoryStore()

  const { projects } = useProjectStore()
  const { worktreesByProject, loadWorktrees, selectWorktree } = useWorktreeStore()
  const { reopenSession, reopenConnectionSession, openOrphanedSession } = useSessionStore()
  const { selectConnection } = useConnectionStore()

  // Debounce the keyword filter
  const debouncedKeyword = useDebounce(filters.keyword, 300)

  // Trigger search when debounced keyword changes
  useEffect(() => {
    if (isOpen) {
      performSearch()
    }
  }, [debouncedKeyword, isOpen, performSearch])

  // Trigger search when non-keyword filters change (isOpen handled by first effect)
  useEffect(() => {
    if (isOpen) {
      performSearch()
    }
  }, [
    filters.projectId,
    filters.worktreeId,
    filters.dateFrom,
    filters.dateTo,
    filters.includeArchived,
    isOpen,
    performSearch
  ])

  // Focus search input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Load worktrees for selected project
  useEffect(() => {
    if (filters.projectId) {
      loadWorktrees(filters.projectId)
    }
  }, [filters.projectId, loadWorktrees])

  // Get worktrees for filter dropdown
  const availableWorktrees = useMemo(() => {
    if (!filters.projectId) return []
    return worktreesByProject.get(filters.projectId) || []
  }, [filters.projectId, worktreesByProject])

  // Check if any filters are active
  const hasActiveFilters =
    filters.keyword !== '' ||
    filters.projectId !== null ||
    filters.worktreeId !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel()
      }
    },
    [closePanel]
  )

  // Handle loading a session
  const handleLoadSession = useCallback(
    async (session: SessionWithWorktree) => {
      // Check if this is a connection session (has connection_id)
      if (session.connection_id) {
        // Check if connection still exists (connection_name will be NULL if deleted)
        if (session.connection_name) {
          // Connection exists - reopen it in connection mode
          const result = await reopenConnectionSession(session.id, session.connection_id)
          if (result.success) {
            selectConnection(session.connection_id)
            closePanel()
            toast.success(
              tr(
                `Loaded session "${session.name || 'Untitled'}"`,
                `已加载会话“${session.name || '未命名'}”`
              )
            )
          } else {
            toast.error(result.error || tr('Failed to load session', '加载会话失败'))
          }
          return
        } else {
          // Connection was deleted - open in read-only mode
          openOrphanedSession(toOrphanedSession(session))
          closePanel()
          toast.info(
            tr('Opened in read-only mode: connection no longer exists.', '已以只读模式打开：连接已不存在。')
          )
          return
        }
      }

      // Check if session has a worktree_id and if that worktree still exists
      if (session.worktree_id && session.worktree_name) {
        // Check if the worktree actually exists in the system
        const allWorktrees = Array.from(worktreesByProject.values()).flat()
        const worktreeExists = allWorktrees.some((w) => w.id === session.worktree_id)

        if (worktreeExists) {
          // Worktree exists - reopen session normally
          const result = await reopenSession(session.id, session.worktree_id)
          if (result.success) {
            selectWorktree(session.worktree_id)
            closePanel()
            toast.success(
              tr(
                `Loaded session "${session.name || 'Untitled'}"`,
                `已加载会话“${session.name || '未命名'}”`
              )
            )
          } else {
            toast.error(result.error || tr('Failed to load session', '加载会话失败'))
          }
        } else {
          // Worktree was deleted/archived - open in read-only mode
          openOrphanedSession(toOrphanedSession(session))
          closePanel()
          toast.info(
            tr(
              `Opened in read-only mode: worktree "${session.worktree_name}" no longer exists.`,
              `已以只读模式打开：工作树“${session.worktree_name}”已不存在。`
            )
          )
        }
      } else {
        // Session is orphaned (no worktree_id or connection_id) - open in read-only mode
        openOrphanedSession(toOrphanedSession(session))
        closePanel()
        toast.info(
          tr(
            'Opened in read-only mode: session is from an archived worktree.',
            '已以只读模式打开：该会话来自已归档工作树。'
          )
        )
      }
    },
    [reopenSession, reopenConnectionSession, openOrphanedSession, closePanel, selectWorktree, selectConnection, worktreesByProject, tr]
  )

  // Get selected session
  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null
    return searchResults.find((s) => s.id === selectedSessionId) || null
  }, [searchResults, selectedSessionId])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={closePanel}
      onKeyDown={handleKeyDown}
      data-testid="session-history-overlay"
    >
      <div
        className="fixed inset-y-0 right-0 w-full max-w-3xl bg-background shadow-xl flex"
        onClick={(e) => e.stopPropagation()}
        data-testid="session-history-panel"
      >
        {/* Left section - Search and results */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">{tr('Session History', '会话历史')}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closePanel}
              data-testid="close-history-button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search and filters */}
          <div className="p-4 border-b border-border space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder={tr('Search title, project, or worktree...', '搜索标题、项目或工作树...')}
                value={filters.keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9"
                data-testid="session-search-input"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {tr(
                'Keyword search matches session metadata (title, project, and worktree) only.',
                '关键词搜索仅匹配会话元数据（标题、项目和工作树）。'
              )}
            </p>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Project filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <FolderGit2 className="h-3.5 w-3.5 mr-1.5" />
                    {filters.projectId
                      ? projects.find((p) => p.id === filters.projectId)?.name ||
                        tr('Project', '项目')
                      : tr('All Projects', '全部项目')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" data-testid="project-filter-dropdown">
                  <DropdownMenuItem onClick={() => setProjectFilter(null)}>
                    {tr('All Projects', '全部项目')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {projects.map((project) => (
                    <DropdownMenuItem key={project.id} onClick={() => setProjectFilter(project.id)}>
                      {project.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Worktree filter (only when project selected) */}
              {filters.projectId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <GitBranch className="h-3.5 w-3.5 mr-1.5" />
                      {filters.worktreeId
                        ? availableWorktrees.find((w) => w.id === filters.worktreeId)?.name ||
                          tr('Worktree', '工作树')
                        : tr('All Worktrees', '全部工作树')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" data-testid="worktree-filter-dropdown">
                    <DropdownMenuItem onClick={() => setWorktreeFilter(null)}>
                      {tr('All Worktrees', '全部工作树')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {availableWorktrees.map((worktree) => (
                      <DropdownMenuItem
                        key={worktree.id}
                        onClick={() => setWorktreeFilter(worktree.id)}
                      >
                        {worktree.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Date filters */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {filters.dateFrom || filters.dateTo
                      ? tr('Date range', '日期范围')
                      : tr('Any time', '任意时间')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56"
                  data-testid="date-filter-dropdown"
                >
                  <div className="p-2 space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">{tr('From', '从')}</label>
                      <Input
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => setDateFromFilter(e.target.value || null)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">{tr('To', '到')}</label>
                      <Input
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => setDateToFilter(e.target.value || null)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More filters dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    {tr('More', '更多')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" data-testid="more-filters-dropdown">
                  <DropdownMenuCheckboxItem
                    checked={filters.includeArchived}
                    onCheckedChange={setIncludeArchived}
                  >
                    {tr('Include archived worktrees', '包含已归档工作树')}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground"
                  onClick={clearFilters}
                  data-testid="clear-filters-button"
                >
                  {tr('Clear filters', '清除筛选')}
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto" data-testid="session-results-list">
            {error && <div className="p-4 bg-destructive/10 text-destructive text-sm">{error}</div>}

            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters} />
            ) : (
              <>
                <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
                  {tr(
                    `${searchResults.length} session${searchResults.length === 1 ? '' : 's'} found`,
                    `找到 ${searchResults.length} 个会话`
                  )}
                </div>
                {searchResults.map((session) => {
                  const isOrphaned = !session.worktree_id || session.worktree_name === undefined
                  return (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isSelected={session.id === selectedSessionId}
                      isOrphaned={isOrphaned}
                      onSelect={() => selectSession(session.id)}
                      onLoad={() => handleLoadSession(session)}
                    />
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* Right section - Preview */}
        {selectedSession && (
          <div className="w-80 flex-shrink-0">
            <SessionPreview
              session={selectedSession}
              onLoad={() => handleLoadSession(selectedSession)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
