import { useState, useMemo } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { Trash2, Plus, Info, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useI18n } from '@/i18n'

export function SettingsSecurity(): React.JSX.Element {
  const { tr } = useI18n()
  const { commandFilter: rawCommandFilter, updateSetting } = useSettingsStore()
  const [newPattern, setNewPattern] = useState('')
  const [activeTab, setActiveTab] = useState<'allowlist' | 'blocklist'>('allowlist')
  const [searchQuery, setSearchQuery] = useState('')

  // Defensive null-guard: commandFilter may be undefined on first hydration from old localStorage
  const commandFilter = rawCommandFilter ?? {
    enabled: true,
    defaultBehavior: 'ask' as const,
    allowlist: [],
    blocklist: []
  }

  const isEnabled = commandFilter.enabled ?? true

  // Filter patterns based on search query
  const filteredAllowlist = useMemo(() => {
    if (!searchQuery) return commandFilter.allowlist
    const query = searchQuery.toLowerCase()
    return commandFilter.allowlist.filter(pattern =>
      pattern.toLowerCase().includes(query)
    )
  }, [commandFilter.allowlist, searchQuery])

  const filteredBlocklist = useMemo(() => {
    if (!searchQuery) return commandFilter.blocklist
    const query = searchQuery.toLowerCase()
    return commandFilter.blocklist.filter(pattern =>
      pattern.toLowerCase().includes(query)
    )
  }, [commandFilter.blocklist, searchQuery])

  const handleToggleEnabled = () => {
    updateSetting('commandFilter', {
      ...commandFilter,
      enabled: !isEnabled
    })
  }

  const handleSetDefaultBehavior = (behavior: 'ask' | 'allow' | 'block') => {
    updateSetting('commandFilter', {
      ...commandFilter,
      defaultBehavior: behavior
    })
  }

  const handleAddPattern = () => {
    const pattern = newPattern.trim()
    if (!pattern) {
      toast.error(tr('Pattern cannot be empty', '规则不能为空'))
      return
    }

    const list = activeTab === 'allowlist' ? commandFilter.allowlist : commandFilter.blocklist

    if (list.includes(pattern)) {
      toast.error(tr('Pattern already exists in this list', '该规则已存在于当前列表中'))
      return
    }

    const updated =
      activeTab === 'allowlist'
        ? { ...commandFilter, allowlist: [...commandFilter.allowlist, pattern] }
        : { ...commandFilter, blocklist: [...commandFilter.blocklist, pattern] }

    updateSetting('commandFilter', updated)
    setNewPattern('')
    toast.success(
      activeTab === 'allowlist'
        ? tr('Pattern added to allowlist', '规则已添加到允许列表')
        : tr('Pattern added to blocklist', '规则已添加到阻止列表')
    )
  }

  const handleRemovePattern = (pattern: string, listType: 'allowlist' | 'blocklist') => {
    const updated =
      listType === 'allowlist'
        ? {
            ...commandFilter,
            allowlist: commandFilter.allowlist.filter((p) => p !== pattern)
          }
        : {
            ...commandFilter,
            blocklist: commandFilter.blocklist.filter((p) => p !== pattern)
          }

    updateSetting('commandFilter', updated)
    toast.success(
      listType === 'allowlist'
        ? tr('Pattern removed from allowlist', '规则已从允许列表移除')
        : tr('Pattern removed from blocklist', '规则已从阻止列表移除')
    )
  }

  return (
    <div className="space-y-6" style={{ overflow: 'hidden' }}>
      <div>
        <h3 className="text-base font-medium mb-1">{tr('Security', '安全')}</h3>
        <p className="text-sm text-muted-foreground">
          {tr(
            'Control command filtering for approval-based agent sessions',
            '控制基于审批的代理会话中的命令过滤行为'
          )}
        </p>
      </div>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">
            {tr('Enable command filtering', '启用命令过滤')}
          </label>
          <p className="text-xs text-muted-foreground">
            {tr(
              'Control which tools and commands approval-based agents can use during sessions',
              '控制需要审批的代理在会话期间可使用哪些工具和命令'
            )}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={isEnabled}
          onClick={handleToggleEnabled}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            height: '24px',
            width: '44px',
            flexShrink: 0,
            cursor: 'pointer',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: isEnabled ? '#059669' : '#52525b',
            transition: 'background-color 200ms'
          }}
          data-testid="command-filter-toggle"
        >
          <span
            style={{
              pointerEvents: 'none',
              display: 'block',
              height: '18px',
              width: '18px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              transition: 'transform 200ms',
              transform: isEnabled ? 'translateX(23px)' : 'translateX(3px)'
            }}
          />
        </button>
      </div>

      {/* Enter to Approve */}
      <div className={cn('flex items-center justify-between', !isEnabled && 'opacity-50 pointer-events-none')}>
        <div>
          <label className="text-sm font-medium">
            {tr('Press Enter to approve commands', '按 Enter 批准命令')}
          </label>
          <p className="text-xs text-muted-foreground">
            {tr(
              'When enabled, pressing Enter approves commands and disables chat input during approval',
              '启用后，按 Enter 会批准命令，并在审批期间禁用聊天输入'
            )}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={commandFilter.enterToApprove ?? false}
          onClick={() => {
            updateSetting('commandFilter', {
              ...commandFilter,
              enterToApprove: !commandFilter.enterToApprove
            })
          }}
          disabled={!isEnabled}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            height: '24px',
            width: '44px',
            flexShrink: 0,
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: commandFilter.enterToApprove ? '#059669' : '#52525b',
            transition: 'background-color 200ms'
          }}
          data-testid="enter-to-approve-toggle"
        >
          <span
            style={{
              pointerEvents: 'none',
              display: 'block',
              height: '18px',
              width: '18px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              transition: 'transform 200ms',
              transform: commandFilter.enterToApprove ? 'translateX(23px)' : 'translateX(3px)'
            }}
          />
        </button>
      </div>

      {/* Default Behavior */}
      <div className={cn('space-y-2', !isEnabled && 'opacity-50 pointer-events-none')}>
        <label className="text-sm font-medium">
          {tr('Default behavior for unlisted commands', '未列出命令的默认行为')}
        </label>
        <p className="text-xs text-muted-foreground">
          {tr('How to handle commands not on either list', '如何处理未出现在任一列表中的命令')}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleSetDefaultBehavior('ask')}
            disabled={!isEnabled}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              commandFilter.defaultBehavior === 'ask'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="default-behavior-ask"
          >
            {tr('Ask for approval', '请求审批')}
          </button>
          <button
            onClick={() => handleSetDefaultBehavior('allow')}
            disabled={!isEnabled}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              commandFilter.defaultBehavior === 'allow'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="default-behavior-allow"
          >
            {tr('Allow silently', '静默允许')}
          </button>
          <button
            onClick={() => handleSetDefaultBehavior('block')}
            disabled={!isEnabled}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              commandFilter.defaultBehavior === 'block'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="default-behavior-block"
          >
            {tr('Block silently', '静默阻止')}
          </button>
        </div>
      </div>

      {/* Info box */}
      <div
        className={cn(
          'rounded-md border border-border bg-muted/30 p-3',
          !isEnabled && 'opacity-50'
        )}
      >
        <div className="flex gap-2">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              {tr('Pattern matching with wildcards:', '使用通配符进行规则匹配：')}
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">*</code>{' '}
                {tr('matches any sequence except /', '匹配除 / 之外的任意字符序列')}
              </li>
              <li>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">**</code>{' '}
                {tr('matches any sequence including /', '匹配包含 / 在内的任意字符序列')}
              </li>
              <li>
                {tr('Example:', '示例：')}{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">bash: npm *</code>{' '}
                {tr('matches all npm commands', '匹配所有 npm 命令')}
              </li>
              <li>
                {tr('Example:', '示例：')}{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">read: src/**</code>{' '}
                {tr('matches any file in src/', '匹配 src/ 下的任意文件')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Priority note */}
      <div
        className={cn(
          'rounded-md border border-border bg-muted/30 p-3',
          !isEnabled && 'opacity-50'
        )}
      >
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{tr('Priority:', '优先级：')}</span>{' '}
          {tr(
            'Blocklist takes precedence over allowlist. If a command matches both, it will be blocked.',
            '阻止列表优先于允许列表。如果某条命令同时匹配两者，它将被阻止。'
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className={cn('space-y-3', !isEnabled && 'opacity-50 pointer-events-none')}>
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('allowlist')}
            disabled={!isEnabled}
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-colors border-b-2',
              activeTab === 'allowlist'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tr('Allowlist', '允许列表')} ({commandFilter.allowlist.length})
          </button>
          <button
            onClick={() => setActiveTab('blocklist')}
            disabled={!isEnabled}
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-colors border-b-2',
              activeTab === 'blocklist'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tr('Blocklist', '阻止列表')} ({commandFilter.blocklist.length})
          </button>
        </div>

        {/* Add pattern input */}
        <div style={{ display: 'flex', gap: '8px', overflow: 'hidden' }}>
          <input
            type="text"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isEnabled) {
                handleAddPattern()
              }
            }}
            disabled={!isEnabled}
            placeholder={
              activeTab === 'allowlist'
                ? tr('e.g., bash: git status or read: src/**', '例如：bash: git status 或 read: src/**')
                : tr('e.g., bash: rm -rf * or edit: .env', '例如：bash: rm -rf * 或 edit: .env')
            }
            style={{ flex: '1 1 0', minWidth: 0 }}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background"
            data-testid="pattern-input"
          />
          <Button
            size="sm"
            className="shrink-0"
            onClick={handleAddPattern}
            disabled={!newPattern.trim() || !isEnabled}
            data-testid="add-pattern-button"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {tr('Add', '添加')}
          </Button>
        </div>

        {/* Search input */}
        {(commandFilter.allowlist.length > 0 || commandFilter.blocklist.length > 0) && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr('Search patterns...', '搜索规则...')}
                disabled={!isEnabled}
                className="w-full pl-8 pr-8 py-1.5 text-sm rounded-md border border-border bg-background disabled:opacity-50"
                data-testid="pattern-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  disabled={!isEnabled}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="clear-search-button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Show filtered count when searching */}
        {searchQuery && (
          <div className="text-xs text-muted-foreground">
            {tr('Showing', '显示')}{' '}
            {activeTab === 'allowlist' ? filteredAllowlist.length : filteredBlocklist.length}{' '}
            {tr('of', '共')}{' '}
            {activeTab === 'allowlist' ? commandFilter.allowlist.length : commandFilter.blocklist.length}{' '}
            {tr('patterns', '条规则')}
          </div>
        )}

        {/* Pattern list with scrolling */}
        <div className="space-y-2 max-h-48 overflow-y-auto" style={{ overflowX: 'hidden' }}>
          {activeTab === 'allowlist' && filteredAllowlist.length === 0 && !searchQuery && (
            <div className="text-xs text-muted-foreground text-center py-4">
              {tr(
                'No patterns in allowlist. Commands will follow the default behavior.',
                '允许列表中暂无规则。命令将按照默认行为处理。'
              )}
            </div>
          )}
          {activeTab === 'allowlist' && filteredAllowlist.length === 0 && searchQuery && (
            <div className="text-xs text-muted-foreground text-center py-4">
              {tr(`No patterns matching "${searchQuery}"`, `没有匹配“${searchQuery}”的规则`)}
            </div>
          )}
          {activeTab === 'blocklist' && filteredBlocklist.length === 0 && !searchQuery && (
            <div className="text-xs text-muted-foreground text-center py-4">
              {tr(
                'No patterns in blocklist. Default dangerous patterns are included on first launch.',
                '阻止列表中暂无规则。首次启动时会自动带入默认危险规则。'
              )}
            </div>
          )}
          {activeTab === 'blocklist' && filteredBlocklist.length === 0 && searchQuery && (
            <div className="text-xs text-muted-foreground text-center py-4">
              {tr(`No patterns matching "${searchQuery}"`, `没有匹配“${searchQuery}”的规则`)}
            </div>
          )}
          {activeTab === 'allowlist' &&
            filteredAllowlist.map((pattern) => (
              <div
                key={pattern}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30"
                style={{ overflow: 'hidden' }}
              >
                <code
                  className="text-xs font-mono"
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap'
                  }}
                  title={pattern}
                >
                  {pattern}
                </code>
                <button
                  onClick={() => handleRemovePattern(pattern, 'allowlist')}
                  disabled={!isEnabled}
                  className="shrink-0 text-destructive hover:text-destructive/80 transition-colors"
                  title={tr('Remove pattern', '移除规则')}
                  data-testid="remove-allowlist-pattern"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          {activeTab === 'blocklist' &&
            filteredBlocklist.map((pattern) => (
              <div
                key={pattern}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30"
                style={{ overflow: 'hidden' }}
              >
                <code
                  className="text-xs font-mono"
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap'
                  }}
                  title={pattern}
                >
                  {pattern}
                </code>
                <button
                  onClick={() => handleRemovePattern(pattern, 'blocklist')}
                  disabled={!isEnabled}
                  className="shrink-0 text-destructive hover:text-destructive/80 transition-colors"
                  title={tr('Remove pattern', '移除规则')}
                  data-testid="remove-blocklist-pattern"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
