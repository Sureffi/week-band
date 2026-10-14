# week-band

The plan above the prompt. A Claude Code mod: a band that reads one page's
```dot block, one node a packet, and keeps it in front of you.

- A node's state is its `class`: `done`, `hand` (yours), `open` (a word
  not said), `end` (where it ends), `next`. Colours are the fallback:
  blue fill done, thick border hand, diamond open, octagon end.
- A node's `tooltip` is its done-when. Each packet is a button; a press
  toasts it. Hotkeys 1–9 while the band has focus (ctrl+x tab), `h` hides.
- `/week` prints the packets as a list with their done-whens.
- The page is a setting, `file`. The band re-reads it when it changes.

Install, from the cyberware.sh shelf:

    /plugin marketplace add Sureffi/cyberware.sh
    /plugin install week-band@cyberware

`file` has no default; the install asks for it. From the shell it is set
at install with `--config`, and changed later through `configure`:

    claude plugin install week-band@cyberware --config file=/path/to/plan.md
    echo '{"file":"/path/to/plan.md"}' | claude plugin configure week-band@cyberware --values-stdin

`claude plugin configure week-band@cyberware` alone shows the value.

The same dot block draws as a graph anywhere graphviz draws, so the plan
is one file with two projections.
