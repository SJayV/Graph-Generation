### User Story 3: Grid Rendering of Vertices and Edges

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