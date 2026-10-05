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

`parameters.js` is the root-level single source of truth for tunables. Only
the root files (`graph.js`, `dispatcher.js`, `main.js`, `panel.js`) read or
write it; lower layers (`logic/`, `algorithms/`, `rendering/`, `empirical/`)
receive the values as arguments.

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

## User Story 3: Noise-Driven Edge Shading

### Ideas

- **Vertices**: a static (non-animated) radial glow — brighter at the center,
  fading to the vertex's normal assigned category color at the rim — replaces
  today's flat-filled circle in `CIRCLE_FRAGMENT_SHADER_SOURCE`. The existing
  circular discard cutoff and per-category color system
  (`COLOR_BY_CATEGORY`/`VERTEX_CATEGORIES`) are unchanged; only the
  per-fragment color ramp from center to rim is new.
- **Edges as connections of light (confirmed with the user):** not straight
  1-pixel lines but soft beams.
  - **Shape:** each edge is drawn as a thin quad instead of a `gl.LINES`
    line, so the fragment shader knows each pixel's normalized position along
    the edge (0 at one vertex, 1 at the other) and across it (centerline to
    side). Width is a fixed maximum in pixels, reached mid-edge, and narrows
    toward both vertices as a function of the normalized position along the
    edge — so a longer edge has the same maximum width but builds up to it
    more slowly.
  - **Soft, translucent sides:** brightness/opacity falls off from the
    centerline toward the sides.
  - **Distorted, moving silhouette:** the width boundary is pushed in and out
    by a time-varying noise field.
  - **Lighter and darker / more translucent bands:** brightness/opacity is
    modulated by the same noise field. The bands shimmer in place (blend in
    and out), with no direction of flow.
  - **One global noise field:** sampled at each fragment's screen position
    plus time, so every edge — background and growing — shows the same field
    wherever they overlap.
  - **Blending:** normal alpha blending (not additive).
  - **Time source:** the per-frame `currentTime` already flows into
    `computeRenderState`; the render state carries it on as one time value
    that the edge shader receives as a uniform.
  - **Tuning:** maximum width, noise scale/speed and band strength are
    hand-tuned constants in the rendering code, not `parameters.js` values.
  - The exact noise function (Perlin/simplex/hashed value noise) is the
    implementer's choice.
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
- FR23. Edges shall be drawn with width: a fixed maximum width in pixels at
  the middle, narrowing toward both vertices as a function of the normalized
  position along the edge.
- FR24. An edge's cross-section shall be soft and translucent toward its
  sides, and its boundary shall be distorted by a time-varying noise field.
- FR25. An edge's brightness/opacity shall vary in lighter and darker bands
  taken from a single time-varying noise field over screen position, shared
  by all edges; the bands shimmer in place without a direction of flow.
- FR26. Overlapping edges shall combine with normal alpha blending.

### Story

As a viewer of the demo, I want vertices rendered with a soft radial glow and
edges rendered as soft, shimmering connections of light, so that the graph's
appearance feels more alive without changing which information each color
and glow convey.

**Acceptance criteria**
1. Accepted when a vertex is drawn, the fragment color at its sprite's center is a brightened version of its category's assigned base color, and the fragment color at its sprite's rim equals its unmodified category base color.
2. Accepted when fragments lie outside the circular sprite radius, they are discarded exactly as today.
3. Accepted when the vertex glow is drawn, it is independent from time.
4. Accepted when both "normal" and "special" category vertices are drawn, each radial glow brightens from its own distinct base color.
5. Accepted when `computeRenderState` is called with a defined `currentTime`, the returned render state carries one time-derived value usable to drive edge noise.
6. Accepted when `computeRenderState` is called twice with different `currentTime` values, that time-derived value differs between the two calls.
7. Accepted when edges of every category are drawn in the same frame, the same time-derived value and the same shader program are used for all three.
8. Accepted when an edge carries a `glow` value from the existing recency-glow-decay mechanism, the new noise-driven shading is present in addition to that glow blending.
9. Accepted when an edge is drawn, the rendered glow's distribution across the edge's fragments differs from today's pure linear interpolation between its two endpoint `aGlow` values; the new noise-driven effect visibly modulates that distribution.
10. Accepted when an edge is drawn, it is narrow at both vertices and widest in the middle, with the same maximum width regardless of the edge's length.
11. Accepted when an edge is drawn, its sides are soft and translucent, and its outline wobbles over time.
12. Accepted when edges are drawn, lighter and darker bands appear along them and shimmer in place without travelling, and edges overlapping at the same screen position show the same banding.
13. Accepted when edges overlap, they combine with normal alpha blending.

No open questions remain for this story.
