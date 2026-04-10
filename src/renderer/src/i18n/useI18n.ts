import { useCallback } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { AppLanguage } from './types'

export function useI18n(): {
  language: AppLanguage
  isChinese: boolean
  tr: (english: string, chinese: string) => string
} {
  const language = useSettingsStore((state) => state.language ?? 'en')
  const tr = useCallback(
    (english: string, chinese: string) => (language === 'zh-CN' ? chinese : english),
    [language]
  )

  return {
    language,
    isChinese: language === 'zh-CN',
    tr
  }
}


export function translateText(english: string, chinese: string): string {
  const language = useSettingsStore.getState().language ?? 'en'
  return language === 'zh-CN' ? chinese : english
}
