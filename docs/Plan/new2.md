# DeepSession — Design System & UI/UX Wireframes

> Compact, practical design system + high-level wireframes for DeepSession — a minimal, offline-first deep-work & progress tracker.

---

## 1. Quick overview

* **Purpose:** Fast, low-friction session tracking with powerful connections between Sessions, Tasks, Goals and Notes.
* **Tone:** Calm, focused, slightly playful — encourage habit formation without pressure.
* **Platform:** Responsive web app (mobile-first progressive web app with PiP floating timer), desktop & tablet.

---

## 2. Brand & Visual language

* **Primary goal:** reduce visual noise so focus content stands out.
* **Logo / Mark:** simple diamond/pulse icon to hint at focus + session timeline.

### Colors (tokens)

* `--primary-500`: #2B6BE0 (deep blue) — CTA, active states
* `--primary-300`: #6F9CF9 — accents
* `--bg`: #0F1724 (dark) / #FFFFFF (light)
* `--surface`: #0B1220 / #F6F8FB
* `--muted`: #98A0B3
* `--success`: #16A34A
* `--warn`: #F59E0B
* `--danger`: #EF4444
* `--accent-1`: #8B5CF6 (for tag accents)

> Provide both light & dark token sets; prefer subtle contrast for long reading.

### Elevation & Shadows

* `elevation-1`: subtle 0 1px 4px rgba(2,6,23,0.12)
* `elevation-2`: 0 6px 20px rgba(2,6,23,0.12)

### Typography

* System stack preferred for performance.
* Headline: `Inter` 600 / 20-28px
* Body: `Inter` 400 / 14-16px
* Mono: `JetBrains Mono` for code/snippets and timers

### Spacing scale (8pt)

* 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64

### Motion

* Micro-interactions: 120–200ms ease-out for buttons
* Modal/Panel transitions: 200–300ms with slight overshoot

---

## 3. Component Library (tokens → components)

### Atomic tokens

* Colors, type, radius (8px default), shadows, spacing, icon sizes (16/20/24/32)

### Buttons

* **Primary large (Start Session)** — full width on mobile, pill shape, icon + label
* **Secondary (Pause/Break)** — ghost or outline
* **Tertiary (Link/Plain)** — text only

States: default / hover / active / disabled.

### Inputs & Chips

* Text input with leading icon; clear button.
* Tag chips: small rounded pill, optional color dot; supports creation on `#` or Enter.

### Timer Card (important)

* Large numeric timer (MM:SS) in mono font.
* Under-timer: progress ring + small label (`Focus / Break`).
* Controls row: Pause / Break / End (icon + label).

### Floating PiP Timer

* Compact card (60–90px height) world always-on-top.
* Shows: small progress ring, numeric time, icon for state, 3-dot menu for Expand/End.

### Session Modal

* Title input, type/category dropdown, tags input, link goal, initial note (small editor), start button.
* Quick suggestions (recent tags, recent goals) shown as chips.

### Session Summary Panel

* After ending: timeline (focus + break segments), quick-edit title/tags/notes, AI summary button.
* Undo / reopen session button.

### Task Item (Today panel)

* Checkbox, title, small tag list, est. time, drag handle.
* Swipe/drag to reorder on mobile.

### Goal Card

* Title, small progress ring (hours done vs target), timeframe badge, due date.
* Actions: Add session / Edit / Pause / Complete.

### Notes List + Editor

* Markdown editor with small toolbar (bold, italic, link, code, bullet list).
* Inline link to sessions/goals (autocomplete `@session` / `#goal`).

### Analytics Widgets

* Stat cards (total time, avg length, sessions), small line/area charts, heatmap grid tile.
* Export button on top-right.

---

## 4. Layouts & High-level wireframes (mobile & desktop flows)

> Each wireframe is described as a set of regions + behaviour. Use this to make quick mockups in Figma or code with Tailwind.

### A. App shell (mobile)

* Top bar: hamburger / app title / avatar
* Main: Dashboard (scroll)
* Bottom nav: Home (dashboard) / Sessions / Goals / Notes / Analytics

### B. Dashboard (default)

* Hero: Today summary (focus time today, streak) + big `Start Session` CTA
* Right below (or below fold on mobile): Today's Tasks (collapsible panel)
* Quick-access row: New Task / New Goal / Quick Note / Timer PiP toggle
* Recent sessions list (compact cards) — tap to expand summary

### C. Start Session flow (lowest friction)

1. Tap `Start Session` (primary). Quick start: either instantly start with defaults or open small modal (floating) for metadata.
2. While running: full-screen timer OR minimized PiP that persists. Controls: Pause, Break, End.
3. When Break: show “Take a break — resume” and reason input optional.
4. End: present summary sheet (editable). Offer AI summary button.

### D. Floating Timer (Desktop & Mobile)

* Always-on-top mini control; draggable; tap expands to full session card.

### E. Tasks / Goals Screen

* Left: filter/search (tags, timeframe)
* Main: list of goals (cards) with progress rings. Tap a goal to see sessions linked and notes.
* Create goal modal with target hours/timeframe.

### F. Notes Screen

* Search bar; top row: New Note / Link to session / Link to goal
* List view: preview + tags + linked type icon
* Note editor: split view (desktop) with session list on right for quick linking.

### G. Analytics Screen

* Top: timeframe selector
* Grid layout 2-column (desktop) / stacked (mobile): big line chart + heatmap + stat cards + tag breakdown.
* Insights panel at bottom with AI highlights & suggestions.

---

## 5. UX Patterns & Edge cases

* **Offline-first UX:** small offline badge in top-left; show last-sync time; optimistic updates.
* **Low friction session start:** default start instantly (one tap), metadata editable later.
* **Accidental end protection:** confirm if session < 1min or show undo for 10s.
* **Multiple breaks:** show timeline with color-coded segments; allow editing break reason later.
* **Privacy:** AI features off by default; explicit consent for sending notes to AI.

---

## 6. Accessibility

* High contrast mode toggle
* Keyboard shortcuts (desktop): `S` start, `P` pause, `B` break, `E` end, `/` search
* Screen reader labels, focus outlines, reachable controls.

---

## 7. Deliverables & Next steps (suggested)

1. Make low-fi wireframes in Figma using the layout sections above.
2. Create component library with Tailwind utility tokens (map color tokens → CSS variables).
3. Build a clickable prototype: Dashboard + Start Session + Floating Timer + Session Summary.
4. Iterate with 3 user tests: self-learner, student, creator. Observe session start friction and note linking.

---

## 8. Appendix — Example screen flow (compact)

1. Launch → Dashboard → Tap Start (1-tap start)
2. Session runs → PiP if minimized → Take breaks → End
3. End → Edit summary → Save → Analytics updates
4. AI weekly recap arrives on `weekly_rollover`

---

*If you want, I can now produce:*

* a Figma wireframe (exportable spec) or
* Tailwind + React component skeletons for the main screens (Dashboard, Timer, SessionModal, Analytics)
