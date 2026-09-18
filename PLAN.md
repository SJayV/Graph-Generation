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

### User Story 1: Grid Rendering of Vertices and Edges

As a viewer of a generated graph, I want its vertices and edges rendered on a grid with edges appearing incrementally in the algorithm's edge-addition order, so that I can visually observe the graph and how it was built.

**Acceptance criteria**
1. Accepted when, given a list of vertex positions, the render-state helper returns a state
   containing exactly one dot per vertex, each positioned at that vertex's given grid
   coordinates (no recomputed/arbitrary layout).
2. Accepted when, given a vertex list, an ordered edge sequence, and a step index `i`, the
   render-state helper returns a state whose visible-edge list contains exactly the first `i`
   edges of the sequence, in that same order (no more, no fewer, no reordering).
3. Accepted when the step index `i` is `0`, the render-state helper returns a state with no
   visible edges (only vertex dots).
4. Accepted when the step index `i` equals the full length of the edge sequence, the
   render-state helper returns a state whose visible-edge list matches the entire sequence,
   each entry connecting the correct pair of vertex dots by their rendered positions.
5. Accepted when the top-level render function is called, it produces its displayed output by
   invoking this same render-state helper — i.e. the helper is the single source of truth for
   what is rendered at a given step, independently callable and queryable from outside the
   render function.
6. Accepted when the top-level render function auto-advances through the edge sequence, the
   elapsed time between edge `i-1` becoming visible and edge `i` becoming visible is the same
   fixed constant for every consecutive pair in the sequence, regardless of how long the
   Python algorithm actually took to compute each edge in the original run.

**Explicitly not covered by this story:** glow/recency highlighting (Story 2).

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
4. Accepted when comparing two visible edges with different elapsed time since becoming
   visible (both within the cooldown window), the more recently visible edge's reported glow
   intensity is strictly greater (monotonically decreasing glow over elapsed time).
5. Accepted when comparing any two visible edges at the same `currentTime`, both edges' glow
   intensity is computed against the same fixed cooldown duration (no per-edge or per-graph
   variation).
6. Accepted when an edge's glow intensity is `0.0`, that edge is still present in the
   visible-edge list at its baseline (non-glowing) appearance — glow reaching zero never
   removes or hides an edge.
7. Accepted when the full edge sequence is visible (step index at full length) and every
   edge's cooldown has elapsed, the resulting state's set of visible edges matches Story 1's
   fully-grown state exactly, differing only in the added glow-intensity values.

**Explicitly not covered by this story:** the exact decay curve shape (e.g. linear vs.
non-linear) beyond the boundary/monotonicity guarantees above — left as an implementation
choice, not a fixed contract.

## Assumptions

_(to be filled in as later steps surface them)_
