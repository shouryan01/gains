# Gains design language

Status: design specification v1.2. The preview’s layout, button styling, and radii have been reviewed positively and should be preserved. The dark surfaces and stronger Open green from v1.1 remain. This revision adds native SwiftUI guidance informed by Apple Design Skill and SwiftUI Expert Skill.

Platform scope: product behavior, information hierarchy, and semantic color roles are shared. CSS dimensions, breakpoints, Lucide icons, React components, and browser APIs describe the web implementation. Section 9 defines their native iOS counterparts.

## 1. Product direction

Gains should feel like a premium training and nutrition product: clear data, readable typography, deliberate interaction, and consistent behavior across desktop and iPhone. References are both MacroFactor Nutrition and MacroFactor Workouts, WHOOP, and DuarteSantos8/openGym. Use their clarity and attention to interaction as references; do not copy branding, illustrations, or proprietary assets.

### Agreed decisions

- Home is an overview with charts, rather than a screen dominated by starting a workout.
- Desktop and iPhone have different compositions within the same design system.
- iPhone has balanced density: a concise summary, a useful main chart, and supporting sections below.
- Two switchable color presets share neutral surfaces and all component geometry.
- Dark mode uses a near-black neutral backdrop with charcoal grouped surfaces; light mode uses softened white. Both are first-class designs.
- Appearance supports Light, Dark, and System independently of the color preset.
- Color is restrained in coverage: charts, selected controls, primary actions, and meaningful status. Open uses a saturated green accent rather than a pastel/mint green. No tinted page backgrounds or decorative multicolor metric tiles.
- Four permanent phone destinations: Overview, Train, Nutrition, Progress. Settings is a header destination. Routines and Exercises belong to Train.
- Overview starts with a sensible section order and supports explicit reordering.
- Overview charts are clean summaries. Tap for a larger detail view; drag to inspect values. Time-range controls belong in detail views.
- Workout logging shows the whole session. Completed exercises can collapse; the current exercise stays prominent. Users can review earlier sets and change exercise order.
- Remove slogans, promotional cards, decorative captions, fake avatars, and filler copy. Database controls belong in Settings. Show actionable storage failures when relevant.

## 2. Information architecture

| Destination | Primary content | Secondary destinations |
| --- | --- | --- |
| Overview | Cross-domain summaries and charts | Chart details, edit section order, start/resume session |
| Train | Today's session, routines, workout history | Exercise library, routine details, active workout |
| Nutrition | Daily food log, calories and protein | Food search, saved meals, targets |
| Progress | Detailed training, body-weight, and nutrition trends | Muscle volume, exercise history, expenditure when available |

Desktop exposes Routines and Exercises as subordinate links under Train, not as unrelated top-level products. Settings sits at the bottom of the desktop sidebar and in the phone header. A back action in a drill-down returns to its originating destination and restores scroll position. Switching destinations does not discard an active session or an unsaved edit silently.

Future AI coaching is a contextual action or secondary destination. It does not take a permanent phone tab by default. Features from later releases may be represented in design examples, but the implementation must not invent working actions before those features exist.

## 3. Responsive composition

Breakpoints follow available space, not device detection.

| Available width | Composition |
| --- | --- |
| Below 768px | Single column, four-item bottom navigation, compact header with Settings, 20px content gutters (16px below 360px) |
| 768–1199px | 80px navigation rail with labels/tooltips; one or two content columns only where each remains readable; 24px gutters |
| 1200px and above | 232px sidebar, desktop header, 32px gutters; content maximum 1440px; primary/supporting grid approximately 1.65:1 |

The layout must work at 320, 390, 430, 768, 1024, and 1440px, at 200% zoom, and with larger text. Content reflows before labels truncate. No page-level horizontal scrolling. Use actual element width for chart layout, not a scaled desktop drawing.

Phone bottom navigation uses 24px icons, 12px labels, at least 48px touch targets, and `env(safe-area-inset-bottom)`. Selected tabs use accent text/icon plus a persistent visual indicator. Unselected tabs are neutral. No raised center action button or oversized colored disc. Main content accounts for navigation and active-session bars, so controls are never obscured.

### Overview

Default order: Training, Weight, Nutrition. The Training section leads initially. Reordering changes the lead section as well as the order below it; restore defaults is available inside Edit overview. Reordering must support explicit move-up/move-down actions as an alternative to drag. Persist the order independently of appearance and units. There is no dashboard editor permanently visible in normal use.

- Phone: header; dominant section with summary values and chart; supporting sections; compact recent sessions when space/content warrants it.
- Desktop: dominant section in the larger column, supporting sections in the smaller column, with recent sessions below. User order determines reading order and placement.
- The header offers Edit overview and Settings. A start/resume workout action is useful but secondary to the overview.
- Default summary periods are fixed and explicitly labeled: training over four calendar weeks, weight over the last 30 days, nutrition for the selected day. Detailed views own independent range controls. Never imply every metric uses a shared period when it does not.
- Do not lead with counts of stored exercises or saved routines. Show completed sessions, planned/completed training, meaningful strength history, weight/trend weight, and calorie/protein targets when data exists.
- No invented composite strength, recovery, or readiness score. Strength history must identify the selected exercise and calculation. Consistency means completed/planned sessions, not an unexplained percentage.

### Train and active workout

Train combines today's planned workout, saved routines, and history. The exercise library is a secondary destination. During a session, replace the normal page header with session context and avoid unrelated navigation competing with logging.

- Show the full ordered exercise list. Use exercise headers and dividers, not a card around every set.
- Exercise header: name, exercise position, completed/total sets, expand/collapse, and an overflow menu.
- Set columns: Set, Previous, Weight, Reps, Complete. Put the unit in the header, not inside every value. Previous performance is visible context, not editable input.
- At narrow widths, keep Set, Weight, Reps, Complete visible; show previous performance as a second line within the set row. Do not squeeze a five-column desktop table into 320px.
- Input text is at least 16px. Numeric cells use tabular figures, right alignment, and appropriate decimal/numeric keyboards. Weight/reps editing stays in place; advanced RIR/RPE, notes, and set types use expansion or a sheet.
- Completing a set visibly updates its checkmark and set count immediately. Keep values readable; do not fade the entire row. The action can be toggled to correct a mistake.
- Completing the last planned set collapses the exercise only if the keyboard is closed and the user is not editing. Never scroll-jump or hide a focused input. The next incomplete exercise becomes prominent without preventing free navigation.
- A compact rest-timer bar shows remaining time, extend, and skip. It stays above phone navigation and avoids covering set rows. A completed rest timer uses an accessible visual state, with sound/haptics subject to user settings and platform support.
- A clearly labeled Finish workout action opens a summary/confirmation. Discard is a separate destructive action. Persistence/sync failures are actionable and never masquerade as successful saves.
- Reorder exercises through explicit move actions and optional drag, retaining entered values. Swapping an exercise must explain what happens to completed sets.

### Nutrition

- Header includes the selected date with previous/next-day controls.
- Calories and protein are the dominant values; carbs/fat are supporting details.
- Compact progress bars or rings may be used, but no huge decorative rings that displace the food log.
- Meal groups use readable rows: food name, amount, calories, protein. Reveal secondary macros on detail/expansion.
- Add food is one primary action. Quick add, saved meal, and copy yesterday are secondary actions in the logging flow.
- Under-target intake is not automatically an error, and a partial day is not depicted as a completed day. No moral labels such as good/bad food or failed day.

### Settings

- Grouped preference rows: Appearance, Color preset, Weight unit. Use one appearance control (System/Light/Dark) and one palette control (Factor/Open).
- Palette preview is a compact pair of swatches with a name and selection checkmark, not a full-screen theme gallery.
- Separate product preferences from Demo data and Storage diagnostics. Reset and reseed retain explicit descriptions of which data they replace.
- No demo database banner permanently occupying the top of every product screen. A quiet Demo label is sufficient; actions move to Settings. Actual storage failures remain visible and actionable.

## 4. Color system

Preset names proposed for the product are **Factor** (blue) and **Open** (green). They describe Gains presets inspired by the references, not official MacroFactor or openGym themes. The original olive/lime surfaces are retired.

openGym's source uses neutral surfaces and offers several accents, with green as its default. Gains adapts that direction into a restrained green preset with stronger light-mode contrast. The Factor preset is a proposed cool-blue interpretation; these values are not claimed to be MacroFactor's exact brand colors.

### Shared appearance tokens

| Semantic token | Light | Dark |
| --- | --- | --- |
| `page` | `#F5F5F5` | `#080809` |
| `surface` | `#FFFFFF` | `#1C1C1E` |
| `surface-raised` | `#FFFFFF` | `#272729` |
| `surface-pressed` | `#EDEEF0` | `#343437` |
| `text-primary` | `#1A1C20` | `#F3F4F6` |
| `text-secondary` | `#61656E` | `#A6A9B0` |
| `divider` | `#E0E2E5` | `#333336` |
| `control-border` | `#81858E` | `#777C86` |
| `chart-grid` | `#E6E8EC` | `#333336` |
| `chart-observation` | `#707780` | `#B4BAC4` |
| `overlay` | black at 32% | black at 52% |

Dividers are quiet structure, not sufficient input boundaries. Use the stronger control-border token where an outline is needed to identify a control. Disabled controls remain recognizable but do not imitate enabled primary actions.

### Palette tokens

| Semantic token | Factor light | Factor dark | Open light | Open dark |
| --- | --- | --- | --- | --- |
| `accent` | `#2864D7` | `#8BB1FF` | `#217A45` | `#28CD4B` |
| `on-accent` | `#FFFFFF` | `#111318` | `#FFFFFF` | `#111318` |
| `accent-pressed` | `#2054B8` | `#A3C1FF` | `#196238` | `#3BD95B` |
| `accent-subtle` | `#EAF0FC` | `#242F45` | `#E8F3EC` | `#172E1C` |
| `focus-ring` | `#2864D7` | `#8BB1FF` | `#217A45` | `#28CD4B` |
| `series-primary` | `#2864D7` | `#8BB1FF` | `#217A45` | `#28CD4B` |
| `series-secondary` | `#7351A8` | `#BDACE5` | `#426C92` | `#9EBFD9` |

Use the palette accent for the active series and primary action. Supporting values remain neutral. Success, warning, and danger are separate semantic roles, so green selected controls in Open are not automatically treated as successful outcomes. Accompany status with text/icons: check, warning, error. Initial status tokens: success `#217A45` / `#79D5A0`, warning `#8A5A00` / `#E5BC73`, danger `#B42332` / `#FF929B` (light/dark).

Measured against the specified surface: secondary text is 5.84:1 light and 7.23:1 dark; Factor accent is 5.39:1 light and 7.97:1 dark; Open accent is 5.34:1 light and 8.04:1 dark. Dark Open filled buttons use dark text (8.78:1 on the accent); white text must not be used on that bright green. Light Open keeps the deeper green for readable small labels on white. These checks do not replace checking every rendered component state, overlay, chart series, and pressed background.

## 5. Typography, spacing, and components

### Type

Use the platform system stack first: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. This gives iPhone a familiar system face without shipping Apple fonts or requiring a font download. Use regular 400, medium 500, and semibold 600 deliberately; no decorative display face or all-caps navigation.

| Role | Size / line height | Weight |
| --- | --- | --- |
| Phone page title | 28 / 34px | 600 |
| Desktop page title | 30 / 38px | 600 |
| Main metric | 32 / 38px | 500 |
| Section title | 18 / 24px | 600 |
| Body, rows, form inputs | 16 / 24px | 400 |
| Supporting labels | 14 / 20px | 400–500 |
| Chart annotations, nav labels | 12 / 16px minimum | 400–500 |

Use `rem` for text, support user scaling, and let containers grow. Numerals in inputs, timers, axes, and comparison tables use tabular figures. Units are smaller or secondary in color but always readable. Avoid extreme negative letter spacing and never use 7–10px product labels.

### Geometry

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48px.
- Section separation: 24px phone, 32px desktop. Container padding: 20px phone, 24px desktop.
- Rows: minimum 52px for simple preference/list rows; set-entry rows 56–64px with 44px minimum effective touch targets.
- Radius: 10px controls, 16px grouped surfaces, 24px sheet top corners. Reserve pills for true segmented controls, short status, or timers.
- Surface separation uses fill and spacing first. Use a divider between related rows. Avoid outlining every chart panel or adding nested cards.
- Elevation is reserved for floating menus, sheets, and dialogs. No glowing accents, floating dashboard cards, or heavy drop shadows in ordinary content.
- One coherent Lucide outline icon family. Typical icons 20px, navigation 24px, stroke 1.75–2px. No colored icon tiles solely for decoration.

### Component and feedback rules

- Filled primary button: palette accent + on-accent text. Secondary actions: neutral surface or text. Destructive action: explicit danger label and appropriate confirmation.
- Segmented controls: neutral track and selected surface; active labels remain readable. No oversized neon selected pills.
- Pressed states change surface promptly without large scaling. Keep focus rings visible and offset from the control boundary.
- Prefer explicit labels. Chevron means navigation/disclosure; external-link arrows appear only on actual external links.
- Skeletons preserve content geometry. A missing value is an em dash with context, never a misleading zero.
- Inline errors stay near the relevant control. Save failures offer retry and preserve entered values.
- Motion: 120ms pressed/state feedback, 180ms small expansion, 240–280ms page/sheet transitions. Use a consistent ease-out curve; avoid springy overshoot and staggered dashboard entrances. Reduced motion removes movement while retaining immediate state feedback.

## 6. Chart language

- Each chart names its metric, unit, range, and aggregation. Distinguish total volume, sets, estimated 1RM, scale weight, trend weight, and expenditure explicitly.
- Overview summaries navigate to detail on tap/click or keyboard activation. No hover-only affordances.
- Detailed views provide 1W, 4W, 12W, and All where appropriate, with the current range in the view heading. Nutrition day views retain a date control instead of pretending to be a multiweek chart.
- Drag/pointer inspection shows a vertical guide, date, and aligned series values. Touch can pin an inspected date. Offer keyboard previous/next-point controls and an accessible data table/summary.
- Use one accent series by default. Scale weight may be neutral observation points while trend weight is a continuous accent line, with a labeled legend. Do not smooth observations into an invented trend.
- Lines are about 2px; grid lines 1px. Area fill is optional and very low opacity. No gradients for decoration, glowing lines, excessive point markers, or truncated bar axes.
- Bar charts start at zero. Weight charts may use a contextual nonzero domain, clearly labeled. Gaps remain gaps. Values from incomplete nutrition days are marked partial and excluded from applicable expenditure calculations.
- Do not extrapolate missing data. If a metric is unavailable in the current release, omit the module or explain availability in its detail destination rather than drawing a fabricated chart.
- For no data, show a concise metric-specific empty state and one meaningful action. A design preview must label illustrative values as sample data.

## 7. Persistence and implementation contract

The foundation below is implemented in the current web app. Screen behaviors tied to later feature releases remain requirements for those releases.

- Theme state: `appearance = system | light | dark`; `colorPreset = factor | open`.
- Use `data-theme` for the resolved light/dark appearance and `data-palette` for the preset. Components read semantic tokens rather than embedding palette hex values.
- Default: System appearance, Factor preset. Follow OS appearance changes live only while System is selected. Render the saved preference before paint where feasible to avoid a light flash in dark mode.
- Add an append-only database migration for color preset and Overview section order; do not edit the initial migration or reset existing local data. Existing users retain their appearance and unit preferences. Validate section-order values against supported module IDs and deduplicate them.
- Persist explicit preference changes and overview ordering. Changing theme must not interrupt a session, clear inputs, alter chart semantics, or reset page position.
- Keep the shared React/Base UI component system. Specify and style its states coherently rather than adding a second UI library.
- Rework the app shell and route grouping before polishing individual pages. Preserve existing URLs through redirects/aliases where practical.
- Do not install fonts, icon systems, runtimes, or additional tools solely to make the preview. Any new production dependency needs a concrete implementation reason.

## 8. Acceptance and rollout

### Visual and interaction review

- Review Factor and Open in light and dark at 390px and 1440px; additionally check 320px, intermediate widths, large text, and 200% zoom.
- Confirm readable labels, logical focus order, at least 44px effective touch targets, WCAG AA text contrast (4.5:1 body, 3:1 large text), and 3:1 necessary control/meaningful graphic contrast. Never use color as the only cue.
- Check mobile safe areas, keyboard-open editing, sheet focus trapping/return, chart touch inspection, and keyboard alternatives.
- Test normal, selected, pressed, focused, disabled, loading, empty, partial, and error states.
- Reorder Overview sections with pointer and keyboard alternatives; verify persistence and restore defaults.
- Verify existing SQLite data, appearance, and units survive migration, reload, and palette changes.
- Keep browser/manual verification with the user unless they request otherwise; run appropriate automated checks for implementation changes.

### Implementation sequence

1. Semantic tokens, typography, shared components, theme persistence migration.
2. Agreed navigation and responsive shell; move demo/storage controls to Settings.
3. Overview composition and honest summaries for currently available data.
4. Chart detail pattern and preferences; later feature releases supply the full analytics modules.
5. Apply the same system to Train, active workout, Nutrition, and Progress as their functionality ships.

The standalone design preview remains illustrative. The web app reads actual SQLite data and applies an append-only preference migration; it does not make future workout logging or food-entry features available in v0.1.

## References

- [MacroFactor Nutrition and Workouts](https://macrofactor.com/)
- [MacroFactor Workouts guide and screen examples](https://macrofactor.com/welcome-to-macrofactor-workouts/)
- [openGym repository](https://github.com/DuarteSantos8/openGym)
- [openGym surface and accent definitions](https://github.com/DuarteSantos8/openGym/blob/main/frontend/src/index.css)
- [WHOOP Home](https://www.whoop.com/us/en/thelocker/the-all-new-whoop-home-screen/)
