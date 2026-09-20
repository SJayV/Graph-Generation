### User Story 4: Recency Glow Decay on Edges

As a viewer of a generated graph, I want each edge to glow strongest right when it appears and
fade out asymptotically thereafter, so that I can visually tell recently-added edges apart from
older ones.

**Acceptance criteria**
1. Accepted when, given a vertex list, edge sequence, step index, and a `currentTime` equal to
   the time an edge became visible, the render-state helper reports that edge's glow intensity
   as `1.0`.
2. Accepted when `currentTime` is strictly after an edge's became-visible time, the render-state
   helper reports a glow intensity strictly less than `1.0` and strictly greater than `0.0` —
   glow approaches but never reaches an exact baseline of `0.0` for any finite elapsed time.
3. Accepted when `currentTime` is far enough past an edge's became-visible time, the reported
   glow intensity is arbitrarily close to `0.0` (below any given small threshold for a large
   enough elapsed time).
4. Accepted when comparing two elapsed times both sufficiently large (deep in the decay's
   tail), the edge with the larger elapsed time has a glow intensity no greater than the
   other's — glow trends toward `0.0` as elapsed time grows, though no ordering is guaranteed
   for small elapsed times.
5. Accepted when comparing any two visible edges, regardless of graph size or edge content,
   the same fixed decay curve determines both edges' glow intensity at equal elapsed times (no
   per-edge or per-graph variation).
6. Accepted when an edge's glow intensity is negligibly close to `0.0`, that edge is still
   present in the visible-edge list at its baseline (non-glowing) appearance — glow is a
   purely visual property and never affects edge visibility, acceptance, or any other
   logic-layer data.
7. Accepted when the full edge sequence is visible (step index at full length) and
   `currentTime` is far enough past every visible edge's became-visible time that glow is
   negligible for all of them, the resulting state's set of visible edges matches Story 3's
   fully-grown state exactly, differing only in the added glow-intensity values.
