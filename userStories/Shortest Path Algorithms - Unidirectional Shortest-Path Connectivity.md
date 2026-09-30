### User Story 5: Unidirectional Shortest-Path Connectivity (Dijkstra + A*)

As a developer extending the graph algorithms layer, I want Dijkstra and A* to connect all special vertices into one component via a shared greedy-search skeleton so that they behave as drop-in, interchangeable edge-selection strategies alongside the existing generator, with no rendering changes needed.

**Acceptance criteria**
1. Accepted when a shared generic search mechanism is given a vertex set, a priority rule, and a stopping rule, it produces accepted edges one at a time in acceptance order and stops once the stopping rule is satisfied.
2. Accepted when the existing graph-generation algorithm is run with any inputs valid before its refactor onto the shared mechanism, it produces the same edges in the same order as before.
3. Accepted when the shared distance primitive is given two vertices, it returns their straight-line (Euclidean) distance.
4. Accepted when Dijkstra is run to completion on a vertex set and a special subset of at least two vertices, every special vertex ends up connected to every other.
5. Accepted when comparing consecutively accepted edges from Dijkstra, each newly accepted edge's cumulative distance from its originating special vertex is greater than or equal to every previously accepted edge's.
6. Accepted when two special vertices become connected by Dijkstra, the total distance connecting them equals the true shortest-path distance between them.
7. Accepted when A* is run to completion, every special vertex ends up connected to every other, identically to Dijkstra.
8. Accepted when A* is given a heuristic that always returns zero, it produces the exact same edges in the exact same order as Dijkstra given the same inputs.
9. Accepted when A*'s default heuristic is queried for a vertex against the current set of not-yet-connected special vertices, it returns the straight-line distance from that vertex to the nearest one.
10. Accepted when Dijkstra or A* is run on a special subset with fewer than two members, no edges are produced.
