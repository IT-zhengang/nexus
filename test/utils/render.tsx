/* eslint-disable react-refresh/only-export-components */
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
}

function TestProviders({ children }: { children: ReactNode }) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
}

function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: TestProviders, ...options })
}

export * from '@testing-library/react'
export { render }
