import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUpdateSetting = vi.fn()
let mockSettingsState: Record<string, unknown> = {}

vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: Object.assign(
    (selector?: (s: unknown) => unknown) => (selector ? selector(mockSettingsState) : mockSettingsState),
    { getState: () => mockSettingsState }
  )
}))

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: () => ({ setTheme: vi.fn() })
}))

vi.mock('@/stores/useShortcutStore', () => ({
  useShortcutStore: () => ({ resetToDefaults: vi.fn() })
}))

vi.mock('@/lib/themes', () => ({ DEFAULT_THEME_ID: 'default' }))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('SettingsGeneral language toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSettingsState = {
      language: 'en',
      autoStartSession: true,
      autoPullBeforeWorktree: true,
      boardMode: 'toggle',
      vimModeEnabled: false,
      mergeConflictMode: 'always-ask',
      tipsEnabled: true,
      breedType: 'dogs',
      showModelIcons: false,
      showModelProvider: false,
      usageIndicatorMode: 'current-agent',
      usageIndicatorProviders: [],
      defaultAgentSdk: 'opencode',
      stripAtMentions: true,
      updateSetting: mockUpdateSetting,
      resetToDefaults: vi.fn()
    }
  })

  it('defaults to English copy and renders both language options', async () => {
    const { SettingsGeneral } = await import('@/components/settings/SettingsGeneral')
    render(<SettingsGeneral />)

    expect(screen.getByText('Language')).toBeInTheDocument()
    expect(screen.getByTestId('language-en')).toHaveTextContent('English')
    expect(screen.getByTestId('language-zh-CN')).toHaveTextContent('简体中文')
  })

  it('switches language setting to zh-CN when Simplified Chinese is selected', async () => {
    const { SettingsGeneral } = await import('@/components/settings/SettingsGeneral')
    render(<SettingsGeneral />)

    await userEvent.click(screen.getByTestId('language-zh-CN'))
    expect(mockUpdateSetting).toHaveBeenCalledWith('language', 'zh-CN')
  })

  it('renders translated labels when current language is zh-CN', async () => {
    mockSettingsState.language = 'zh-CN'

    const { SettingsGeneral } = await import('@/components/settings/SettingsGeneral')
    render(<SettingsGeneral />)

    expect(screen.getByText('通用')).toBeInTheDocument()
    expect(screen.getByText('语言')).toBeInTheDocument()
    expect(screen.getByText('AI 提供方')).toBeInTheDocument()
  })
})
