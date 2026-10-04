# PLAN

This project processes one feature at a time (plan -> test -> implement ->
document -> finalize). Structural correction (confirmed by the user): this is
**one feature**, "Visual Tuning", made of **three user stories**:

1. Centralized Parametrization
2. Run Control Keybindings
3. Noise-Driven Edge Shading

Per `AGENTS.md`, planning is only complete once all three stories below are
finalized with converged, testable acceptance criteria. All three are
finalized below — no open questions remain for any of them.

Architecture Map in `AGENTS.md` has already been updated by the user to
document `parameters.js` as the root-level single source of truth for
tunables, read by `graph.js` / `dispatcher.js` / `logic/randomness/edges.js`,
plus a mutable-shared-state exception note under data flow (writes only by
the root orchestration layer in response to user input — this covers the
new root-level `panel.js` from User Story 2). The repo map still needs a
`panel.js` bullet (Architecture Map edits are reserved to the
architecture-planning skill / the user).

---

# Feature: Visual Tuning

## Ideas

- **Domain concept**: three independent-but-related capabilities make up one
  coherent "tune how the demo looks and behaves at runtime" feature: (1) a
  single configuration source of truth, (2) keyboard-driven run control built
  on that source of truth, and (3) a new fixed visual style for vertices and
  edges. (1) is a prerequisite for (2)'s editable panel; (3) is independent of
  both but shares the feature's "tuning" theme and its root-level/rendering
  touch points.
- Full rationale for each story's internal design choices is kept inline
  under that story's own section below, to keep each story self-contained.

## Requirements

Requirements are grouped per story below (Group 1 / Group 2 / Group 3),
since each story has a distinct concern even though they share one feature.

---

## User Story 2: Run Control Keybindings

### Ideas

- Enter extends the existing Tab precedent (Story 8) in `main.js`'s
  `keydown` listener: a fresh graph, but on the *same* algorithm (no advance).
- Space opens an interactive editable panel (confirmed scope, bigger than a
  read-only overlay): parameter values can be changed live in the panel but
  are only committed and regenerated on an explicit apply action — not
  live-as-you-type — per the user's decision.
- **Panel module (confirmed):** a new root-level `panel.js`, next to
  `main.js`/`parameters.js` — imperative-shell DOM/input code, closely coupled
  to `parameters.js`. It shows one input per `parameters.js` value, each with
  a human-readable name above the field. Sigma is not shown (it is derived,
  not a value). The less self-explanatory values (dampening factor,
  strengthening factor) get a plain-language label, not their constant name.
  Its validation is a pure, DOM-independent function (unit-testable); the
  DOM wiring itself is untested shell code, same class as `main.js`'s
  `keydown` listener.
- **Runtime mutability (confirmed):** `parameters.js`'s values become
  `export let`, plus one exported setter (e.g. `setParameters(values)`) that
  the panel's apply action calls. ES modules' live bindings mean every
  existing `import { VERTEX_COUNT } from "./parameters.js"` sees the new
  value — no consumer import changes. One consumer needs a fix:
  `rendering/gl/glPrimitives.js` derives its clip bound from the screen
  margin once at module load, so it must derive it per call instead, or an
  applied margin would never take effect.
- Per AGENTS.md's "input validation at system boundary" security rule, every
  staged edit is validated/bounded before it reaches `parameters.js`. Bounds
  for the original five are derived from constraints already enforced
  elsewhere in the codebase; bounds for the four newer ones were confirmed
  with the user:
  - vertex count: positive integer, at most grid capacity `(L + 1)^2`
    (`sampleVertices` already throws above that; confirmed `(L + 1)^2`, not
    `L^2`, since the grid includes both 0 and L).
  - grid size: positive integer (`L >= 1`).
  - special-subset size: integer, `0 <= k <= vertexCount`
    (`selectSpecialSubset`'s existing bound).
  - sparsity: positive real (`r > 0`, a multiplier in `m = floor(r * n)`).
  - nearest-neighbor count: integer, `1 <= k_nn <= vertexCount - 1`.
  - dampening factor: real in `(0, 1]` — shrinks strength, never zeroes it.
  - strengthening factor: real, `>= 1` — boosts, never shrinks.
  - edge reveal pacing: positive integer (milliseconds).
  - screen margin fraction: real in `[0, 0.5)` — at 0.5 the drawing area
    collapses.
  Cross-field bounds (vertex count vs. grid size, special-subset size and
  nearest-neighbor count vs. vertex count) are checked against the *staged*
  values, not the currently applied ones.
- This story depends on User Story 1 (reads/writes `parameters.js`'s values)
  but is otherwise self-contained.

### Requirements (Group 2)

- FR8. Pressing Enter shall regenerate a fresh vertex set, special subset,
  and candidate edge set, and run them through the *currently selected*
  algorithm, with no change to which algorithm is active.
- FR9. Pressing Enter mid-animation shall fully replace the in-progress
  stepwise reveal, matching Tab's existing replacement behavior.
- FR10. Pressing Space shall toggle an editable panel (`panel.js`) with one
  input per `parameters.js` value, each with a human-readable name above it,
  pre-filled with the current values.
- FR11. Edits in the panel shall be staged locally and shall not mutate
  `parameters.js` or trigger regeneration until an explicit apply action is
  triggered.
- FR12. Pressing Space while the panel is open shall act as the combined
  verify-and-apply action: it shall validate every staged value against its
  bound (listed under Ideas above); if any value is out of bounds, nothing is
  committed, nothing regenerates, and the panel stays open.
- FR13. On a successful apply, `parameters.js`'s values shall update to the
  staged values, the panel shall close, and a fresh graph shall regenerate
  using them, on the same algorithm as before.
- FR14. While the panel is open, no key other than Space shall have any
  effect — Tab, Enter, and every other key are fully inert until the panel is
  closed.
- FR15. While the panel is closed, keys other than Tab, Enter, and Space
  shall leave algorithm and graph state unaffected.
- FR16. `parameters.js` shall expose one setter that updates its values at
  runtime; every consumer shall see applied values on its next use, including
  screen margin and edge reveal pacing (no value frozen at module load).
- FR17. Validation shall be a pure function, given a full set of staged
  values, returning which values (if any) violate their bound — including
  cross-field bounds evaluated against the staged values.

### Story

As a viewer of the demo, I want to press Enter to restart the current
algorithm on a fresh graph, and press Space to open an editable panel where I
can retune generation parameters and apply them, so that I can experiment
with different parameter values without editing code.

**Acceptance criteria**
1. Accepted when the Space key is pressed while the panel is hidden, a panel appears showing one editable input per parameter, each with a human-readable name above it, pre-filled with `parameters.js`'s current values.
2. Accepted when the panel is visible and an edit is staged without yet being applied, `parameters.js`'s exported values remain unchanged.
3. Accepted when the Space key is pressed again while the panel is visible and every staged value is within its valid bounds, the panel verifies and applies them: `parameters.js`'s values update to the staged values, the panel closes, and a fresh graph regenerates using them, on the same algorithm as before.
4. Accepted when the Space key is pressed again while the panel is visible and at least one staged value is outside its valid bounds, that value is rejected: `parameters.js`'s values remain unchanged, no regeneration occurs, and the panel stays open with an indication of which value(s) were rejected.
5. Accepted when the panel is open, no key other than Space has any effect until the panel is closed via a successful apply.
6. Accepted when the validation function is given a set of staged values, it reports exactly the values outside their bounds, and reports none when all are within bounds.
7. Accepted when the validation function is given a vertex count above `(gridSize + 1)^2`, a special-subset size above the vertex count, or a nearest-neighbor count above `vertexCount - 1`, it reports that value as invalid.
8. Accepted when new values are applied through `parameters.js`'s setter, every consumer uses them on its next use without reloading the page.
9. Accepted when the Enter key is pressed while the panel is closed, a freshly sampled vertex set, special subset, and candidate edge set are generated and passed to the currently selected algorithm, with no change to which algorithm is active.
10. Accepted when Enter is pressed while a previous graph's stepwise reveal animation was mid-playback, the previous render state is fully replaced.
11. Accepted when Tab is pressed while the panel is closed, its existing cycle-and-regenerate behavior is unaffected by the addition of Enter and Space handling.
12. Accepted when any key other than Tab, Enter, or Space is pressed while the panel is closed, the currently displayed algorithm and graph are unaffected.

No open questions remain for this story.

---

## User Story 3: Noise-Driven Edge Shading

### Ideas

- **Vertices**: a static (non-animated) radial glow — brighter at the center,
  fading to the vertex's normal assigned category color at the rim — replaces
  today's flat-filled circle in `CIRCLE_FRAGMENT_SHADER_SOURCE`. The existing
  circular discard cutoff and per-category color system
  (`COLOR_BY_CATEGORY`/`VERTEX_CATEGORIES`) are unchanged; only the
  per-fragment color ramp from center to rim is new.
- **Edges**: a noise-driven dynamic/animated visual perturbation (the user's
  explicit choice, over dash-flow, pulsing width, and static-gradient
  alternatives that were considered and rejected). The existing per-frame
  `currentTime` already flows into `computeRenderState` (used today only to
  derive `glow`); the same time value is extended into a render-state-level,
  time-derived field that the edge shader consumes to drive the noise, so the
  effect is "assertable without visual inspection" per AGENTS.md's rendering
  interface rule: the *driving value* is a plain testable number, even though
  the resulting per-pixel noise pattern itself is a GLSL implementation
  detail left to the implementer (Perlin/simplex/hashed noise are all
  acceptable choices, not mandated here).
- **One shader for all edge categories, one shader for all vertex
  categories (resolved):** today, `drawRenderState` already applies a single
  shared `edgeProgram` across all three `EDGE_CATEGORIES`
  (background/normal/special) and a single shared `circleProgram` across both
  `VERTEX_CATEGORIES`, differing only by the `COLOR_BY_CATEGORY` uniform —
  this story's new shading follows the same existing pattern exactly: one
  noise mechanism, one glow mechanism, applied uniformly to every edge
  regardless of category, with only color differing per category (as today).
  No deliberate difference between the static background layer and the
  growing/overlay edges — this resolves the open design tension flagged in
  earlier drafts.
- **Static, not configurable (YAGNI, confirmed):** this new look is a
  permanent replacement of the current shaders, not a `parameters.js` value
  and not controlled by User Story 2's panel. No style-switching mechanism or
  extensibility hook is being built now, even though the user noted it could
  conceivably be made extensible later.
- **Glow coexistence (confirmed):** the existing recency-glow-decay blend
  (`rendering/state/glow.js`'s `computeGlow`, uploaded as `aGlow`) must keep
  working exactly as today; the new noise shading is additive/alongside it,
  never a replacement.

### Requirements (Group 3)

- FR16. Vertex fragments shall show a radial gradient: brightened toward the
  sprite center, equal to the unmodified category color at the rim, with the
  existing circular discard cutoff unchanged.
- FR17. The vertex radial glow shall not depend on `currentTime` or any other
  changing input (static, non-animated).
- FR18. `COLOR_BY_CATEGORY`, `EDGE_CATEGORIES`, and `VERTEX_CATEGORIES` shall
  remain unchanged — category-to-color differentiation is preserved exactly
  as today.
- FR19. The render state produced for edges shall carry one time-derived
  value, differing when `currentTime` differs, usable by the edge shader to
  drive a continuously-varying noise effect.
- FR20. The same time-derived value and the same edge shader program shall
  apply to every edge category (background, normal, special) uniformly — no
  deliberate visual difference in the noise mechanism between layers.
- FR21. The existing `glow` value itself (as computed by `computeGlow`,
  including its decay-over-time behavior) shall continue to be computed
  exactly as today. The new noise-driven effect shall modulate how that glow
  value is visually distributed across an edge's fragments — the modulation's
  exact visual character is intentionally left open for hand-tuning, but it
  shall be observably different from today's distribution (pure linear
  interpolation between the edge's two endpoint `aGlow` values, with no other
  spatial variation).
- FR22. No new `parameters.js` export, and no new keybinding, shall control
  vertex or edge shape/shading selection (static, not user-configurable).

### Story

As a viewer of the demo, I want vertices rendered with a soft radial glow and
edges rendered with a continuously-varying noise-driven shading, so that the
graph's appearance feels more alive without changing which information each
color and glow convey.

**Acceptance criteria**
1. Accepted when a vertex is drawn, the fragment color at its sprite's center is a brightened version of its category's assigned base color, and the fragment color at its sprite's rim equals its unmodified category base color.
2. Accepted when fragments lie outside the circular sprite radius, they are discarded exactly as today.
3. Accepted when `computeRenderState` is called twice with identical vertex and category inputs but different `currentTime` values, the rendered vertex color at a given distance from center is identical in both calls.
4. Accepted when both "normal" and "special" category vertices are drawn, each radial glow brightens from its own distinct base color.
5. Accepted when `computeRenderState` is called with a defined `currentTime`, the returned render state carries one time-derived value usable to drive edge noise.
6. Accepted when `computeRenderState` is called twice with different `currentTime` values, that time-derived value differs between the two calls.
7. Accepted when edges of every category are drawn in the same frame, the same time-derived value and the same shader program are used for all three.
8. Accepted when an edge carries a `glow` value from the existing recency-glow-decay mechanism, the new noise-driven shading is present in addition to that glow blending.
9. Accepted when an edge is drawn, the rendered glow's distribution across the edge's fragments differs from today's pure linear interpolation between its two endpoint `aGlow` values; the new noise-driven effect visibly modulates that distribution.

No open questions remain for this story.
