### User Story 7: Static Edge-Set Baseline Layer

As a viewer of the demo, I want to see the algorithm's full candidate edge set as a dim, always-visible background layer beneath the actively-growing edges, and see the edges that actually connect the specials light up in the same orange as the special vertices once the algorithm finishes, so that I can tell at a glance which candidate connections were available, and which ones the algorithm actually used to connect the specials.

**Acceptance criteria**
1. Accepted when an edge set is supplied, every edge in it appears as a background edge from the very first rendered step, before any edge has been accepted.
2. Accepted when no edge set is supplied, no background edges appear at any step.
3. Accepted when the step index advances, the background edges remain exactly the same throughout.
4. Accepted when a background edge and an actively-growing edge are rendered, the background edge is strictly less bright than the actively-growing edge.
5. Accepted when the algorithm has finished, exactly the subset of accepted edges that lie on a path connecting two special vertices can be identified from its result.
6. Accepted when the algorithm finishes, the edges connecting the specials are marked, with the same glow-at-reveal any newly-revealed edge gets.
7. Accepted when an edge is both part of the accepted growth and part of the final connecting path, its final highlighted appearance visually takes precedence over its earlier growth-phase appearance.
