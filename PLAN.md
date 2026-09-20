# Feature: Graph Visualization

## Requirements

### Scope
Rendering / visual layer (view on model), per AGENTS.md's Architecture Map, living in
`rendering/` (all WebGL, js files). Consumes graphs produced by the existing logic layer
(`logic/algorithm.py`), specifically the ordered edge-addition sequence yielded by
`growEdgesStepwise`. This feature does not touch `logic/`.

### Functional Requirements

1. **Grid-positioned vertex rendering**
   - The system shall render every vertex of a given graph as a dot on a grid.
   - Each vertex's dot shall be positioned at that vertex's fixed grid position (as produced
     by the logic layer), not an arbitrary or recomputed layout position.

2. **Edge rendering**
   - The system shall render every accepted edge of a given graph as a line connecting the
     dots of its two endpoint vertices.

3. **Stepwise / ordered rendering**
   - The system shall be able to render the graph incrementally, following the ordered
     edge-addition sequence produced by `growEdgesStepwise`, rather than only rendering a
     single final static edge set.
   - The order in which edges appear on screen shall match the order in which they were
     greedily accepted by the algorithm; the exported data carries this order only, no
     per-edge timestamps.
   - The pacing between edges appearing on screen shall be owned by the rendering layer, not
     derived from the Python algorithm's real computation time.

4. **Edge glow / recency highlight**
   - The system shall visually highlight ("glow") an edge more strongly the more recently it
     was added to the graph.
   - The glow intensity for a given edge shall decay over time since that edge's creation,
     following a fixed cooldown/duration that is the same constant for every edge (no
     per-edge or per-graph variation), measured on the rendering layer's own timeline.
   - Once an edge's cooldown has elapsed, its glow shall settle to the same baseline
     appearance as any other non-recent edge.

### Non-Functional / Out-of-Scope Notes
- No requirements have been raised (yet) for: camera controls, coloring beyond the glow
  effect, node dragging/interaction, external UI controls, or animation-speed controls.
  These are explicitly not in scope unless raised separately — flagged as open questions
  below where they may affect testability.

### Architecture Decisions (resolved via architecture-planning skill, see AGENTS.md)
- Python-to-JS data bridge: the logic layer exports a static JSON file (vertices, ordered
  edge-addition sequence); the rendering layer reads that JSON directly. No server /
  networking component. One-directional: rendering never calls back into logic.
- Testability: the rendering layer exposes a minimal programmatic entry point — a function
  taking a vertex/edge-sequence and returning a queryable render/glow state — so acceptance
  criteria can assert on state rather than requiring visual inspection.

## User Stories

### User Story 2: Recency Glow Decay on Edges

As a viewer of a generated graph, I want each edge to glow strongest right when it appears and
fade out over a fixed duration, so that I can visually tell recently-added edges apart from
older ones.

Builds on Story 1: the render-state helper is extended with a `currentTime` parameter (a
single global elapsed-time value, in the rendering layer's own timeline — not derived from
Python's real computation time); each visible edge additionally records the time it became
visible, and the queried state carries a normalized glow intensity per edge derived from
`currentTime` minus that edge's became-visible time. The cooldown duration is a fixed constant
in the rendering layer, not a caller-supplied parameter.

**Acceptance criteria**
1. Accepted when, given a vertex list, edge sequence, step index, and a `currentTime` equal to
   the time an edge became visible, the render-state helper reports that edge's glow intensity
   as `1.0`.
2. Accepted when `currentTime` is at or beyond an edge's became-visible time plus the fixed
   cooldown duration, the render-state helper reports that edge's glow intensity as `0.0`.
3. Accepted when `currentTime` is strictly between an edge's became-visible time and
   became-visible time plus the cooldown duration, the render-state helper reports a glow
   intensity strictly between `0.0` and `1.0`.
4. Accepted when comparing two elapsed times both sufficiently close to the cooldown
   duration (i.e. in the tail of the cooldown window, approaching expiry), the edge closer to
   expiry has a glow intensity no greater than the other's — glow trends toward `0.0` as
   expiry approaches, though no ordering is guaranteed elsewhere in the window.
5. Accepted when comparing any two visible edges, regardless of graph size or edge content,
   the same fixed cooldown duration determines both edges' glow-intensity boundary (no
   per-edge or per-graph variation).
6. Accepted when an edge's glow intensity is `0.0`, that edge is still present in the
   visible-edge list at its baseline (non-glowing) appearance — glow is a purely visual
   property and never affects edge visibility, acceptance, or any other logic-layer data.
7. Accepted when the full edge sequence is visible (step index at full length) and every
   edge's cooldown has elapsed, the resulting state's set of visible edges matches Story 1's
   fully-grown state exactly, differing only in the added glow-intensity values.

**Explicitly not covered by this story:** the exact decay curve shape (e.g. linear vs.
non-linear) beyond the boundary/monotonicity guarantees above — left as an implementation
choice, not a fixed contract.

## Assumptions

### Vertex rendering
- A1: Every vertex in the input list appears exactly once as a dot in the render state.
- A2: A dot's rendered position equals its input vertex's position exactly — no
  transformation or recomputed layout.

### Stepwise edge visibility
- A3: For a step index `i` (`0 <= i <= length of sequence`), the visible-edge count equals
  `i` exactly.
- A4: Visible edges preserve the input sequence's order — the first `i` visible edges
  correspond index-for-index to the first `i` entries of the sequence.
- A5: `i = 0` yields an empty visible-edge list; vertex dots remain present regardless.
- A6: `i = length of sequence` yields a visible-edge list equal to the entire sequence.
- A7: Visibility is monotonic in `i` — an edge visible at step `i` remains visible at every
  step `i' >= i`.
- A8: Every visible edge's two endpoints reference vertex dots that exist in the same render
  state (no dangling edge endpoints).

### Render function / helper relationship
- A9: The top-level render function's displayed output is fully determined by the
  render-state helper's return value for the current step — no independent rendering logic
  bypasses the helper.
- A10: The render-state helper is callable and queryable independently of the top-level
  render function — its result is not hidden internal state only reachable through the full
  render pipeline.

### Playback pacing
- A11: During auto-advance, the elapsed time between edge `i-1` becoming visible and edge `i`
  becoming visible is the same fixed constant for every consecutive pair.
- A12: This pacing constant does not depend on any per-edge timing from the original Python
  computation — no such timing is available, since the exported data carries edge order
  only, no timestamps.
- A13: The pacing constant is fixed for a given rendering run — it does not vary with vertex
  count, edge count, or the content of the vertices/edges themselves.

**Superseded:** A14 (JSON data loading) is obsolete for the same reason as AC7 above — no
JSON bridge exists in the current architecture.

### Glow decay
- A15: Glow intensity is bounded to `[0.0, 1.0]`, exactly `1.0` at the moment an edge becomes
  visible and exactly `0.0` once its cooldown has fully elapsed.
- A16: In the tail of the cooldown window (elapsed time sufficiently close to the cooldown
  duration), glow intensity trends toward `0.0` as elapsed time increases — no ordering
  guarantee elsewhere in the window (the curve need not be monotonic throughout).
- A17: The cooldown duration is a single fixed constant, identical for every edge and every
  graph — not caller-supplied, not derived from vertex count, edge count, or edge content.
- A18: The glow effect is purely visual/presentational — it never affects which edges are
  visible, edge acceptance, or any other logic-layer data; an edge at `0.0` glow remains in
  the visible-edge list at baseline appearance.
- A19: When every visible edge's cooldown has elapsed, the resulting vertex dots and
  visible-edge list are identical to Story 1's state, aside from the added glow-intensity
  values.
