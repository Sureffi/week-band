import { test, expect, mock } from 'claude-code/testing'

const SAMPLE = `# x
\`\`\`dot
digraph week {
  node [shape=box]
  gaps  [label="host gaps\\n139bc36", class="done", tooltip="landed"]
  box   [label="BOX\\nyour card", class="hand", tooltip="ssh root@<IPV4> hostname answers"]
  name  [label="rail's name\\n?", class="open"]
  call  [label="the call \\"the rail is Lumio's\\"", class="next"]
  hack  [label="hackathon", class="end"]
  gaps -> box
}
\`\`\`
`

test('the band draws the packets in file order, states from class, a press toasts the done-when', async ($, on) => {
  on('fs.stat', async () => ({ value: { kind: 'file', size: SAMPLE.length, mtimeMs: 1, isLink: false } }))
  on('fs.read', async () => ({ value: SAMPLE }))
  on('session.start', async (_, e) => e)
  mock.clock(on)
  on('command.register', async () => ({ value: undefined }))
  const toasts: string[] = []
  on('ui.toast', async (_, e) => { toasts.push(e.text); return { value: undefined } })
  await $.session.start({ cwd: '/srv/app', surface: 'terminal', isInteractive: true })
  for (const surface of ['terminal', 'desktop'] as const) {
    const tree = await $.ui.render({ plugin: 'week-band', surface, component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 10, columns: 120 } })
    const text = JSON.stringify(tree)
    expect(text.indexOf('host gaps')).toBeLessThan(text.indexOf('BOX'))
    expect(text.indexOf('BOX')).toBeLessThan(text.indexOf("rail's name"))
    expect(text).toContain("the rail is Lumio's")
    expect(text).toContain('hackathon')
    await $.ui.press({ plugin: 'week-band', key: 'box', surface })
  }
  expect(toasts[0]).toContain('ssh root@<IPV4> hostname answers')
})
