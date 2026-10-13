import { atom, read, update } from 'claude-code'
import type { Register, EngineInterface } from 'claude-code'

import type { Packet, State } from '../types'

const packets = atom({ plugin: 'week-band', key: 'packets' } as const, [] as Packet[])
const mtime = atom({ plugin: 'week-band', key: 'mtimeMs' } as const, 0)
const isHidden = atom({ plugin: 'week-band', key: 'isHidden' } as const, false)

const STATES: State[] = ['done', 'hand', 'open', 'end', 'next']

const unquote = (s: string): string => s.replace(/\\n/g, ' · ').replace(/\\"/g, '"')

const attr = (attrs: string, name: string): string | undefined =>
  attrs.match(new RegExp(`\\b${name}="((?:[^"\\\\]|\\\\.)*)"`))?.[1]

const stateOf = (attrs: string): State => {
  const cls = attr(attrs, 'class')
  if (cls && (STATES as string[]).includes(cls)) return cls as State
  if (/fillcolor="#233d8c"/.test(attrs)) return 'done'
  if (/penwidth=2/.test(attrs)) return 'hand'
  if (/shape=diamond/.test(attrs)) return 'open'
  if (/shape=octagon/.test(attrs)) return 'end'
  return 'next'
}

const parse = (text: string): Packet[] => {
  const fence = text.match(/```dot\n([\s\S]*?)```/)
  if (!fence) return []
  const out: Packet[] = []
  for (const line of fence[1].split('\n')) {
    const m = line.match(/^\s*(\w+)\s*\[(.*)\]\s*$/)
    if (!m || m[1] === 'node' || m[1] === 'edge' || m[1] === 'graph') continue
    const attrs = m[2]
    out.push({
      id: m[1],
      label: unquote(attr(attrs, 'label') ?? m[1]),
      state: stateOf(attrs),
      note: unquote(attr(attrs, 'tooltip') ?? ''),
    })
  }
  return out
}

const GLYPH: Record<State, string> = { done: '●', hand: '▶', open: '◇', end: '⬢', next: '○' }
const COLOR: Record<State, 'success' | 'warning' | 'suggestion' | 'error' | 'inactive'> = {
  done: 'success', hand: 'warning', open: 'suggestion', end: 'error', next: 'inactive',
}

async function refresh($: EngineInterface, file: string): Promise<void> {
  const stat = await $.fs.stat(file).catch(() => undefined)
  if (!stat) return
  const seen = await read($, mtime)
  if (stat.mtimeMs === seen) return
  const text = await $.fs.read(file)
  await update($, packets, () => parse(text))
  await update($, mtime, () => stat.mtimeMs)
}

export const register: Register = (on, options) => {
  const file = String(options.file)

  on('session.start', async ($, e, next) => {
    await refresh($, file)
    $.clock.every(3000, () => { void refresh($, file) })
    $.command.register({ name: 'week', description: 'The plan as a list, each packet with its state and its done-when' })
    return next(e)
  })

  on('command.run', { name: 'week' }, async ($) => {
    const list = await read($, packets)
    if (list.length === 0) return { text: `no plan in ${file}` }
    const lines = list.map(p => `${GLYPH[p.state]} ${p.label}${p.note ? `\n    ${p.note}` : ''}`)
    return { text: lines.join('\n') }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, packets)
    if (e.props.hasSurvey || list.length === 0 || (await read($, isHidden))) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" flexWrap="wrap">
        {list.map((p, i) => (
          <Box key={p.id} marginRight={2}>
            <Button
              key={p.id}
              hotkey={i < 9 ? String(i + 1) : undefined}
              onPress={() => { $.ui.toast(p.note ? `${p.label}: ${p.note}` : p.label) }}
            >
              <Text color={COLOR[p.state]} bold={p.state === 'hand'}>{GLYPH[p.state]} </Text>
              <Text color={COLOR[p.state]} dimColor={p.state === 'next'}>{p.label}</Text>
            </Button>
            {i < list.length - 1 ? <Text dimColor>  →</Text> : null}
          </Box>
        ))}
        <Button key="hide" hotkey="h" label="hide" onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
