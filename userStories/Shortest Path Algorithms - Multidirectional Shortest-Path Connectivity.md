### User Story 6: Multidirectional Shortest-Path Connectivity (Multidirectional Dijkstra + A*)

As a developer extending the graph algorithms layer, I want multidirectional variants of Dijkstra and A* that search from one independent frontier per special vertex simultaneously, so that special-vertex connections can be found with less search-space exploration than the unidirectional versions, while still producing the same drop-in edge-sequence output as every other algorithm in this layer.

**Acceptance criteria**
1. Accepted when multidirectional Dijkstra is run to completion on a vertex set and a special subset of at least two vertices, every special vertex ends up connected to every other.
2. Accepted when two special vertices become connected by multidirectional Dijkstra, the total distance connecting them equals the true shortest-path distance between them.
3. Accepted when multidirectional and unidirectional Dijkstra are run on the same inputs, both produce the same total connecting distance between any two special vertices that end up directly connected.
4. Accepted when multidirectional A* is run to completion, it satisfies the same connectivity and shortest-distance-correctness guarantees as multidirectional Dijkstra.
5. Accepted when multidirectional A* is given a heuristic that always returns zero, it produces the same total connecting distances as multidirectional Dijkstra given the same inputs.
6. Accepted when either multidirectional algorithm is run on a special subset with fewer than two members, no edges are produced.
7. Accepted when either multidirectional algorithm is substituted for any other algorithm in this layer, no caller-side changes are needed to consume it.
