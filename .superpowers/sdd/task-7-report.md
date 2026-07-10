# Task 7 Report: Build HowItWorks (3-step section with scroll reveals)

## What I Implemented

Replaced the stub `src/components/landing/HowItWorks.tsx` with the full 3-step "How it works" section, using the brief's code verbatim.

- `"use client"` directive present.
- Imports `MessagesSquare`, `Gauge`, `Map` from `lucide-react` (all verified to exist in installed lucide-react v1.23.0 — see verification below).
- Imports `Reveal` from `./Reveal` (confirmed `Reveal` accepts `className`, `delay`, and `children` props matching usage).
- `STEPS` array with 3 entries:
  - 01 — `MessagesSquare` — "Converse with the AI consultant"
  - 02 — `Gauge` — "Watch the scorecard build live"
  - 03 — `Map` — "Get a sequenced transformation roadmap"
- Section: `border-y border-border bg-card/30 py-20`, `max-w-7xl` container.
- Heading block wrapped in centered `Reveal`.
- 3-column responsive grid (`md:grid-cols-3`) of cards; each card wrapped in `Reveal` with staggered `delay={i * 0.1}`.
- Each card: icon in `bg-primary/10` rounded tile + monospace numbered label (`text-accent`), title, body.

## Verification

### lucide-react icon exports

Checked the installed version (v1.23.0) and confirmed all three icons are exported:

```
$ node -e "const l = require('lucide-react'); console.log(typeof l.MessagesSquare, typeof l.Gauge, typeof l.Map);"
object object object
```

No substitutions needed — `MessagesSquare`, `Gauge`, and `Map` are all valid named exports.

### tsc

```
$ npx tsc --noEmit
(clean — no output)
```

### build

```
$ npm run build
✓ Compiled successfully in 2.1s
✓ Generating static pages (12/12)
```

Build succeeds. (Unrelated pre-existing warning about multiple lockfiles / workspace root inference — not introduced by this task.)

## Commit

```
cc4e6cc feat(landing): add HowItWorks 3-step section with scroll reveals
1 file changed, 58 insertions(+), 2 deletions(-)
```

Only `src/components/landing/HowItWorks.tsx` modified — confirmed via `git diff --name-only`.

## Self-Review

| Check | Result |
|---|---|
| 3 steps | yes |
| lucide icons (MessagesSquare, Gauge, Map) | yes, verified exported |
| numbered labels (01/02/03) | yes, monospace, `text-accent` |
| Reveal with staggered delays | yes, `delay={i * 0.1}` -> 0, 0.1, 0.2 |
| `"use client"` | yes |
| border-y section | yes, `border-y border-border bg-card/30 py-20` |
| cards with icon + number + title + body | yes |
| only HowItWorks.tsx touched | yes |
| tsc clean | yes |
| build OK | yes |

## Concerns

None. Code matches the brief verbatim; all dependencies verified. The lockfile/workspace-root warning is pre-existing and unrelated to this change.

Note: the pre-existing `task-7-report.md` at this path was a stale artifact from a prior task-numbering (an agent-kickoff task, not this UI task). It has been overwritten with this report.
