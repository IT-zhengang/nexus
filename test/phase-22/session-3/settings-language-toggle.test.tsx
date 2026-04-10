import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUpdateSetting = vi.fn()
let mockSettingsState: Record<string, unknown> = {}

vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: Object.assign(
    (selector?: (s: unknown) => unknown) => (selector ? selector(mockSettingsState) : mockSettingsState),
    {
      getState: () => mockSettingsState
    }
  )
}))

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: Object.assign(
    (selector?: (s: unknown) => unknown) => {
      const state = { setTheme: vi.fn() }
      return selector ? selector(state) : state
    },
    {
      getState: () => ({ setTheme: vi.fn() })
    }
  )
}))

vi.mock('@/stores/useShortcutStore', () => ({
  useShortcutStore: Object.assign(
    (selector?: (s: unknown) => unknown) => {
      const state = { resetToDefaults: vi.fn() }
      return selector ? selector(state) : state
    },
    {
      getState: () => ({ resetToDefaults: vi.fn() })
    }
  )
}))

vi.mock('@/lib/themes', () => ({
  DEFAULT_THEME_ID: 'default'
}))

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

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

  it('defaults to English copy when language is en', async () => {
    const { SettingsGeneral } = await import('@/components/settings/SettingsGeneral')
    render(<SettingsGeneral />)

    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Language')).toBeInTheDocument()
    expect(screen.getByTestId('language-en')).toHaveClass('bg-primary')
  })

  it('renders Chinese copy when language is zh-CN', async () => {
    mockSettingsState.language = 'zh-CN'

    const { SettingsGeneral } = await import('@/components/settings/SettingsGeneral')
    render(<SettingsGeneral />)

    expect(screen.getByText('通用')).toBeInTheDocument()
    expect(screen.getByText('语言')).toBeInTheDocument()
    expect(screen.getByTestId('language-zh-CN')).toHaveClass('bg-primary')
  })

  it('updates language to zh-CN when simplified Chinese is clicked', async () => {
    const { SettingsGeneral } = await import('@/components/settings/SettingsGeneral')
    render(<SettingsGeneral />)

    await userEvent.click(screen.getByTestId('language-zh-CN'))

    expect(mockUpdateSetting).toHaveBeenCalledWith('language', 'zh-CN')
  })
})
