import { describe, it, expect } from 'vitest'
import { DEFAULT_SHORTCUTS } from '../../../src/renderer/src/lib/keyboard-shortcuts'

describe('keyboard shortcuts source text', () => {
  it('keeps default shortcut labels and descriptions as stable English source strings', () => {
    expect(DEFAULT_SHORTCUTS.find((shortcut) => shortcut.id === 'session:new')).toMatchObject({
      label: 'New Session',
      description: 'Create a new chat session'
    })

    expect(DEFAULT_SHORTCUTS.find((shortcut) => shortcut.id === 'settings:open')).toMatchObject({
      label: 'Open Settings',
      description: 'Open the settings panel'
    })
  })
})
