export type State = 'done' | 'hand' | 'open' | 'end' | 'next'
export type Packet = { id: string; label: string; state: State; note: string }

declare module 'claude-code' {
  interface PluginState {
    'week-band': { packets: Packet[]; mtimeMs: number; isHidden: boolean }
  }
}
