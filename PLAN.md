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
mutated only by `main.js`'s input handling, plus a mutable-shared-state
exception note under data flow. No further Architecture Map work is needed.

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

## User Story 1: Centralized Parametrization

### Ideas

- **Domain concept**: today, each consuming module owns its own tunable
  constant(s) — `graph.js` (`VERTEX_COUNT`, `GRID_SIZE`,
  `SPECIAL_SUBSET_SIZE`), `dispatcher.js` (`GENERATION_SPARSITY`, and an
  inline sigma-derivation formula over `GRID_SIZE`), `logic/randomness/edges.js`
  (`NEAREST_NEIGHBOR_COUNT`), `logic/computation/field.js` (`SIGMA_DIVISOR`,
  `DAMPENING_FACTOR`, `STRENGTHENING_FACTOR`), `rendering/state/renderer.js`
  (`EDGE_PACING_MILLISECONDS`), `rendering/gl/glPrimitives.js`
  (`SCREEN_MARGIN_FRACTION`). The goal is one parameter record
  `π = (n, L, k_special, r, k_nn, d_σ, λ, κ, t_pace, m_screen)` — vertex
  count, grid size, special-subset size, sparsity, nearest-neighbor count,
  field sigma divisor, field dampening factor, field strengthening factor,
  edge reveal pacing (ms), and screen margin fraction — exported from a
  single `parameters.js`, with every consumer importing from it instead of
  declaring a local constant.
- **Scope confirmed with the user (expanded from the original 5):** sparsity,
  the field's sigma divisor/dampening/strengthening factors, edge pacing, and
  screen margin are all in scope for centralization. Explicitly confirmed
  OUT of scope (left where they are, not centralized): `empirical/fitter.js`'s
  `MAX_ITERATIONS`/`GRADIENT_TOLERANCE`/`LEARNING_RATE` (unrelated subsystem),
  `logic/randomness/vertices.js`'s `GAUSSIAN_SIGMA_DIVISOR`, `rendering/state/glow.js`'s
  `GAMMA_RATE`/`SCALE`, and `rendering/gl/drawPrimitives.js`'s `VERTEX_SIZE`.
- **Forward note for User Story 2's panel (not actionable here):** the less
  self-explanatory new values (field sigma divisor, dampening factor,
  strengthening factor) will need a plain-language explanation/label when
  shown in User Story 2's editable panel, not just their constant name —
  flagged for that story's design, not this one's.
- **Sigma stays derived, not stored as a flat value — and now lives in
  `parameters.js` as the formula itself (revised decision).** Sigma is still
  not one of `parameters.js`'s flat exported constants (no `SIGMA` value
  sitting there), but the derivation formula itself
  (`GRID_SIZE / Math.sqrt(vertexCount)`) moves into `parameters.js` as an
  exported function, e.g. `sigmaForVertexCount(vertexCount)`, using
  `parameters.js`'s own `GRID_SIZE`. `dispatcher.js`'s private
  `_sigmaForVertexCount` is removed entirely; `dispatcher.js` calls the
  `parameters.js`-exported function instead. No new tuning constant is
  introduced: the user already hand-tuned and then deliberately removed an
  earlier `SIGMA_TUNING_CONSTANT` experiment from `dispatcher.js`, so
  reintroducing any such knob here would be reversing a decision already
  made, not centralizing an existing one.
- **Discovered pre-existing inconsistency (not in scope to fix here, flagged
  for awareness):** `logic/computation/field.js` already exports an unrelated
  `sigmaFromGridSize(gridSize) = gridSize / SIGMA_DIVISOR` (`SIGMA_DIVISOR =
  15.0`), used by `empirical/trialRunner.js`, and matching README's
  formalization ("$\sigma$ scaled to $L$, fixed per run" — no vertex-count
  term). The formula moving into `parameters.js` (`dispatcher.js`'s current
  one) instead scales by `1/sqrt(vertexCount)` and ignores `SIGMA_DIVISOR`
  entirely — two different sigma formulas coexist in the codebase today
  (`field.js`'s `sigmaFromGridSize`, now itself reading `SIGMA_DIVISOR` from
  `parameters.js` per FR8, is a separate, still-unreconciled formula). This
  story does not reconcile them (out of
  scope, not raised as a blocking question since the user already decided to
  keep dispatcher.js's formula shape); noting it here so it isn't mistaken for
  an oversight later.

### Requirements (Group 1)

- FR1. `parameters.js` shall export named values for: vertex count, grid size,
  special-subset size, sparsity, nearest-neighbor count, field sigma divisor,
  field dampening factor, field strengthening factor, edge reveal pacing (in
  milliseconds), and screen margin fraction.
- FR2. `graph.js` shall import vertex count, grid size, and special-subset
  size from `parameters.js`, with no locally-declared constants of the same
  purpose remaining.
- FR3. `dispatcher.js` shall import sparsity from `parameters.js`, with no
  locally-declared constant of the same purpose remaining.
- FR4. `logic/randomness/edges.js` shall import the nearest-neighbor count
  from `parameters.js`, with no locally-declared constant of the same purpose
  remaining.
- FR5. `parameters.js` shall export a sigma-derivation function (taking a
  vertex count, using `parameters.js`'s own grid size), implementing the same
  formula `dispatcher.js` uses today (`GRID_SIZE / Math.sqrt(vertexCount)`),
  producing the exact same numeric result as today for the same inputs.
  `dispatcher.js`'s private `_sigmaForVertexCount` is removed entirely;
  `dispatcher.js` calls `parameters.js`'s exported function instead.
- FR6. Changing any one exported value in `parameters.js` shall change the
  corresponding behavior across every consuming module, with no edits
  required anywhere else.
- FR7. `parameters.js` shall have no dependency on `graph.js`, `dispatcher.js`,
  or `logic/randomness/edges.js` (one-directional dependency flow — it is a
  pure, dependency-free data module).
- FR8. `logic/computation/field.js` shall import its sigma divisor,
  dampening factor, and strengthening factor from `parameters.js`, with no
  locally-declared constants of the same purpose remaining; `sigmaFromGridSize`,
  `fieldValue`, and `key`'s behavior shall be numerically unchanged for the
  same inputs.
- FR9. `rendering/state/renderer.js` shall import edge reveal pacing from
  `parameters.js`; its own `EDGE_PACING_MILLISECONDS` export shall re-export
  that same value (preserving every existing import site's path), with no
  independently-declared constant of the same purpose remaining.
- FR10. `rendering/gl/glPrimitives.js` shall import screen margin fraction
  from `parameters.js`, with no locally-declared constant of the same purpose
  remaining; the derived clip-space bound shall be numerically unchanged for
  the same input.

### Story

As a maintainer of the demo, I want all tunable generation constants
centralized in one parameters module, so that I can change a single file to
retune graph generation across the whole app.

**Acceptance criteria**
1. Accepted when `parameters.js` exports named values for vertex count, grid size, special-subset size, sparsity, nearest-neighbor count, field sigma divisor, field dampening factor, field strengthening factor, edge reveal pacing, and screen margin fraction.
2. Accepted when `graph.js` imports vertex count, grid size, and special-subset size from `parameters.js`, and no longer declares its own constants for those three values.
3. Accepted when `dispatcher.js` imports sparsity from `parameters.js`, and no longer declares its own constant for sparsity.
4. Accepted when `logic/randomness/edges.js` imports the nearest-neighbor count from `parameters.js`, and no longer declares its own constant for that value.
5. Accepted when `parameters.js`'s exported sigma-derivation function is given the same vertex count as today, it produces the exact same numeric result as today's formula; `dispatcher.js` no longer has its own `_sigmaForVertexCount` function and calls `parameters.js`'s function instead.
6. Accepted when one exported value in `parameters.js` is changed and the demo is reloaded, the corresponding generated graph property changes with no edits to any file other than `parameters.js`.
7. Accepted when `parameters.js`'s own module source is inspected, it imports nothing from `graph.js`, `dispatcher.js`, or `logic/randomness/edges.js`.
8. Accepted when `logic/computation/field.js`'s `sigmaFromGridSize`, `fieldValue`, and `key` are called with the same inputs as today, they produce the exact same numeric results as today, now sourcing their sigma divisor/dampening/strengthening factor from `parameters.js`.
9. Accepted when `rendering/state/renderer.js`'s `EDGE_PACING_MILLISECONDS` is imported from its existing path (as every current test already does), it still resolves to the same value, now sourced from `parameters.js`.
10. Accepted when `rendering/gl/glPrimitives.js`'s coordinate-mapping functions are called with the same inputs as today, they produce the exact same numeric results as today, now sourcing the screen margin fraction from `parameters.js`.

No open questions remain for this story.

---

## User Story 2: Run Control Keybindings

### Ideas

- Enter extends the existing Tab precedent (Story 8) in `main.js`'s
  `keydown` listener: a fresh graph, but on the *same* algorithm (no advance).
- Space opens an interactive editable panel (confirmed scope, bigger than a
  read-only overlay): parameter values can be changed live in the panel but
  are only committed and regenerated on an explicit apply action — not
  live-as-you-type — per the user's decision.
- Per AGENTS.md's "input validation at system boundary" security rule, every
  staged edit is validated/bounded before it reaches `parameters.js`. Bounds
  below are derived directly from constraints already enforced elsewhere in
  the codebase, not invented from scratch:
  - vertex count: `sampleVertices` already throws if `n` exceeds grid
    capacity `(L + 1)^2`; a positive-integer lower bound is the natural
    complement (zero or negative vertices is not a valid graph).
  - grid size: must be a positive integer so the grid capacity bound above is
    meaningful (`L >= 1`).
  - special-subset size: `selectSpecialSubset` already throws if `k < 0` or
    `k > allVertices.length` — reused verbatim as the bound (`0 <= k <=
    vertexCount`).
  - sparsity: used as a strictly-positive multiplier (`m = floor(r * n)`); a
    positive-real lower bound (`r > 0`) is the natural domain constraint.
  - nearest-neighbor count: must leave at least one other vertex to connect
    to and less neighbors than exist (`1 <= k_nn <= vertexCount - 1`) —
    otherwise `buildNearestNeighborEdges` would either produce no candidate
    edges or request more neighbors than exist.
- This story depends on User Story 1 (reads/writes `parameters.js`'s values)
  but is otherwise self-contained.

### Requirements (Group 2)

- FR8. Pressing Enter shall regenerate a fresh vertex set, special subset,
  and candidate edge set, and run them through the *currently selected*
  algorithm, with no change to which algorithm is active.
- FR9. Pressing Enter mid-animation shall fully replace the in-progress
  stepwise reveal, matching Tab's existing replacement behavior.
- FR10. Pressing Space shall toggle an editable panel with one input per
  `parameters.js` value, pre-filled with the current values.
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

### Story

As a viewer of the demo, I want to press Enter to restart the current
algorithm on a fresh graph, and press Space to open an editable panel where I
can retune generation parameters and apply them, so that I can experiment
with different parameter values without editing code.

**Acceptance criteria**
1. Accepted when the Space key is pressed while the panel is hidden, a panel appears showing one editable input per parameter, pre-filled with `parameters.js`'s current values.
2. Accepted when the panel is visible and an edit is staged without yet being applied, `parameters.js`'s exported values remain unchanged.
3. Accepted when the Space key is pressed again while the panel is visible and every staged value is within its valid bounds, the panel verifies and applies them: `parameters.js`'s values update to the staged values, the panel closes, and a fresh graph regenerates using them, on the same algorithm as before.
4. Accepted when the Space key is pressed again while the panel is visible and at least one staged value is outside its valid bounds, that value is rejected: `parameters.js`'s values remain unchanged, no regeneration occurs, and the panel stays open with an indication of which value(s) were rejected.
5. Accepted when the panel is open, no key other than Space has any effect until the panel is closed via a successful apply.
6. Accepted when the Enter key is pressed while the panel is closed, a freshly sampled vertex set, special subset, and candidate edge set are generated and passed to the currently selected algorithm, with no change to which algorithm is active.
7. Accepted when Enter is pressed while a previous graph's stepwise reveal animation was mid-playback, the previous render state is fully replaced.
8. Accepted when Tab is pressed while the panel is closed, its existing cycle-and-regenerate behavior is unaffected by the addition of Enter and Space handling.
9. Accepted when any key other than Tab, Enter, or Space is pressed while the panel is closed, the currently displayed algorithm and graph are unaffected.

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
