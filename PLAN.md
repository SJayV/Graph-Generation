# Feature: Shortest Path Algorithms

## Requirements

### Scope

This feature covers:
- implementation of shortest-path-based *connectivity* algorithms in `algorithms/` (Dijkstra, A*, multidirectional Dijkstra, multidirectional A*) that operate on the **same fixed input shape as `algorithms/generation.js`**: a full vertex set (`allVertices`), a `specialSubset`, and a `DSU` over them — NOT a pre-built sparse graph and NOT a single fixed source/target pair.
- treating the vertex set as a **complete graph** (every pair is a candidate edge), weighted by Euclidean distance $w(u,v) = \lVert u-v \rVert_2$; there is no "no path found" outcome in this feature, since a direct edge between any two vertices is always assumed available.
- the algorithms' goal is to **progressively connect all special vertices into one DSU component**, mirroring `generation.js`'s greedy accept-and-union loop, not to answer a single source→target distance query.
- extracting a **shared greedy-search skeleton** (`algorithms/greedyAlgorithm.js`) that captures the candidate-heap-driven accept/union/reactivate loop already present in `generation.js`, and **refactoring `generation.js` itself onto that skeleton** as a thin configuration (own priority function + own termination predicate), with its externally observable behavior (`growEdgesStepwise`, `growEdges`, existing tests) unchanged.
- new shared `logic/` primitives needed to support the above: a Euclidean edge-weight/distance function, and a heuristic function for A*.
- output of every new algorithm file matches `generation.js`'s existing external interface (a `growEdgesStepwise`-shaped generator yielding accepted `[u, v]` vertex-pair edges one at a time, in acceptance order) so `main.js` and `rendering/` can consume any algorithm interchangeably, unmodified.
- a keyboard-driven algorithm switcher in `main.js`: pressing Tab cycles to the next algorithm (generation, Dijkstra, A*, multidirectional Dijkstra, multidirectional A*) and restarts the demo on a freshly generated graph using the newly selected algorithm — this is `main.js`-level orchestration, not a `rendering/` change (the existing rendering pipeline is simply re-fed a new vertex set + edge sequence from the newly selected algorithm, exactly as it already is on every page load).

This feature explicitly does NOT cover:
- any change to `rendering/` — the existing stepwise, recency-glow rendering already consumes whatever edge sequence + vertex set it is given, and needs no changes to support any algorithm in this feature.
- the `r` (sparsity ratio) parameter or a target-edge-count termination — these belong to `generation.js`'s own configuration of the shared skeleton and are not used by any of the new algorithms, whose termination is connectivity-based instead.
- any single fixed-source/fixed-target "point A to point B" query mode; that is a different, narrower problem this feature does not address.

### Functional Requirements

1. **Complete-graph, all-vertices input shape**: every new algorithm accepts the same inputs as `algorithms/generation.js` — `allVertices`, `specialSubset`, and (implicitly, via a `DSU`) special-subset membership and component tracking — not a sparse pre-built edge list and not a single source/target pair. Every pair of vertices is a candidate edge.
2. **Euclidean edge weight as a shared primitive**: the weight of any candidate edge `(u, v)` is $w(u,v) = \lVert u-v \rVert_2$, computed by one shared `logic/` function used identically by every algorithm in this feature (and available for `generation.js` to adopt where relevant).
3. **Goal is full special-vertex connectivity, not single-pair distance**: each algorithm repeatedly selects and accepts edges (via the shared greedy skeleton) to progressively merge the special vertices' DSU components, continuing until all members of `specialSubset` share one root — there is no source/target pair and no "shortest path between two given points" query in this feature's public interface.
4. **No "no path found" outcome**: because the complete graph is assumed given, every pair of vertices is directly connectable at minimum, so full connectivity of the specials is always eventually reachable. No algorithm in this feature needs to represent or handle a "no path" case.
5. **Connectivity-based termination**: termination is "all special vertices share one DSU root," checked via the DSU (e.g. by comparing `find()` results or component membership across `specialSubset`), not a target-edge-count / sparsity-ratio (`r`) condition. `r` is not a parameter of any of these algorithms.
6. **Drop-in stepwise generator interface**: every algorithm exposes a generator matching `growEdgesStepwise`'s shape — yielding accepted `[u, v]` vertex-pair edges one at a time, in acceptance order — so `main.js` can swap in any algorithm from this feature as a strategy without changes to `main.js`'s consumption logic or to `rendering/`.
7. **Shared greedy-search skeleton extraction**: `algorithms/greedyAlgorithm.js` is introduced as a template-method-shaped shared driver capturing: build initial candidate-pair heap keyed by a priority function -> pop -> skip if pair already accepted -> accept (union in DSU) + reactivate/recompute priorities for affected candidates -> repeat until a termination predicate holds. It parameterizes over (a) a priority/key function and (b) a termination predicate, leaving the rest of the loop structure shared.
8. **`generation.js` refactor onto the shared skeleton (in scope)**: `algorithms/generation.js` is refactored to be a thin configuration of `greedyAlgorithm.js`, using its existing Gaussian-field `key()` as the priority function and "target edge count reached" as the termination predicate. This is an internal-implementation-only change: `growEdgesStepwise` and `growEdges`'s observable behavior (inputs, outputs, edge acceptance order, yielded values) must not change, and all existing tests for `generation.js` must keep passing unchanged.
9. **Dijkstra as a skeleton configuration**: `algorithms/dijkstra.js` configures the shared skeleton with priority = current tentative shortest-path distance from the relevant special-vertex frontier(s), and termination = all special vertices share one DSU component.
10. **A\* as a skeleton configuration**: `algorithms/astar.js` configures the shared skeleton with priority = tentative distance + heuristic (via a new `logic/heuristic.js` primitive), and the same connectivity-based termination as Dijkstra. The heuristic must be swappable without modifying `astar.js`'s own logic.
11. **Heuristic primitive adapted to the "connect all specials" framing**: `logic/heuristic.js` exposes a default admissible heuristic (straight-line/Euclidean distance), but its signature/semantics must fit this feature's multi-target "connect all specials" goal rather than assuming one single fixed target vertex — exact signature to be settled in user-story/architecture phases, not here.
12. **Multidirectional Dijkstra and A\* as separate files**: `algorithms/multidirectionalDijkstra.js` and `algorithms/multidirectionalAstar.js` are implemented as their own files (not flags/parameters on the unidirectional versions), each maintaining one independent search frontier per special vertex, all expanding simultaneously, merging pairwise whenever two frontiers meet — a direct generalization of two-way bidirectional search to `k` simultaneous origins (as opposed to Story 5's Dijkstra/A*, which use a single shared multi-source queue rather than independent per-special frontiers). They should fit the shared skeleton where feasible; exact fit is an open architecture question (see below).
13. **Tab-key algorithm switching**: `main.js` maintains a fixed, ordered list of the algorithms introduced by this feature (plus `generation.js`); pressing Tab advances to the next algorithm in that list (wrapping around at the end), generates a fresh vertex set/special subset, runs the newly selected algorithm on it, and restarts the render loop with the new result — replacing whatever graph/algorithm was previously displayed.

### Architecture Decisions

- **Input shape parity with `generation.js`**: every new algorithm file's public interface takes `(allVertices, specialSubset, ...algorithm-specific-params)`, matching `generation.js`'s existing signature shape, rather than a pre-built adjacency/edge list or a source/target pair.
- **New `logic/` primitives**:
  - `logic/distance.js` (new file — confirmed not to exist yet as a standalone primitive): exposes the Euclidean weight function $w(u,v) = \lVert u-v \rVert_2$. Checked: `logic/rng.js`'s `gaussian(x, mu, sigma)` computes squared distance inline but does not expose it, and `logic/field.js` never calls a distance primitive directly (only `gaussian`) — so this must be a genuinely new module, not an extraction of an already-exported function.
  - `logic/heuristic.js` (new file): exposes a default admissible heuristic for A*, adapted to the "connect all specials" framing rather than a single fixed target — exact signature deferred to later steps.
  - existing `logic/minHeap.js` and `logic/dsu.js` are reused as-is by all new algorithms, consistent with `generation.js`'s precedent.
- **Shared greedy-search skeleton (`algorithms/greedyAlgorithm.js`)**: a template-method-shaped driver extracted from `generation.js`'s existing loop structure (build heap -> pop -> skip-if-accepted -> accept+union+reactivate -> repeat until termination predicate). Configured per algorithm by:
  - a priority/key function: Gaussian-field `key()` for `generation.js`, tentative shortest-path distance for Dijkstra, distance + heuristic for A*.
  - a termination predicate: target edge count reached for `generation.js`; all special vertices share one DSU root for Dijkstra and A*.
  This is a structural, in-scope refactor of already-shipped code (`generation.js`), not just new algorithm files. It requires care: `growEdgesStepwise`'s and `growEdges`'s observable behavior and existing test suite must remain unchanged — only the internal implementation moves onto the shared skeleton.
- **`algorithms/` file layout**: one file per complete algorithm, matching `generation.js`'s established one-file-per-algorithm precedent:
  - `algorithms/greedyAlgorithm.js` (new shared skeleton, not itself a complete algorithm)
  - `algorithms/generation.js` (refactored onto the skeleton; behavior unchanged)
  - `algorithms/dijkstra.js`
  - `algorithms/astar.js`
  - `algorithms/multidirectionalDijkstra.js`
  - `algorithms/multidirectionalAstar.js`
- **Output contract**: every algorithm file (except possibly the multidirectional variants, pending the open question below) exposes at least a `growEdgesStepwise`-shaped generator yielding accepted `[u, v]` vertex-pair edges one at a time in acceptance order, so `main.js` and `rendering/` require no changes to consume any of them interchangeably as a drop-in strategy.
- **Multidirectional reuse of `greedyAlgorithm.js` (resolved)**: `algorithms/greedyAlgorithm.js` yields via a generator (`function*`), which makes it inherently steppable/resumable — no new control-flow is needed in the shared skeleton itself. `algorithms/multidirectionalDijkstra.js`/`multidirectionalAstar.js` instantiate `k` independent single-source configurations of the existing skeleton (one generator instance per special vertex, priority = distance from just that one special vertex, not Story 5's shared multi-source setup). A thin coordinator local to each multidirectional file round-robins `.next()` calls across all `k` instances and maintains a shared "which frontier reached this vertex first" map; whenever a newly accepted edge's endpoint was already reached by a different frontier, that is a meeting event — the two frontiers' components are unioned via the shared `DSU` (already referenced by every instance) and the search continues until all of `specialSubset` shares one root. `greedyAlgorithm.js`'s own contract from Story 5 is unchanged by this.

## User Stories

### User Story 5: Unidirectional Shortest-Path Connectivity (Dijkstra + A*)

As a developer extending the graph algorithms layer, I want Dijkstra and A* to connect all
special vertices into one component via a shared greedy-search skeleton — the same skeleton
`generation.js` is refactored onto — so that they behave as drop-in, interchangeable
edge-selection strategies alongside the existing generator, with no rendering changes needed.

Builds on `generation.js`'s existing accept/union/reactivate loop, generalized into
`algorithms/greedyAlgorithm.js`. Both algorithms treat every member of `specialSubset` as a
simultaneous source at distance `0` (multi-source frontier growth); a candidate boundary edge
`(u,v)`'s priority is `u`'s already-accepted cumulative distance from its originating special
vertex plus `w(u,v)` (Dijkstra), or that same value plus a heuristic estimate from `v` to the
nearest not-yet-connected special vertex (A*). Termination is reached once all of
`specialSubset` shares one DSU root — not a target edge count.

**Acceptance criteria**
1. Accepted when `algorithms/greedyAlgorithm.js` is invoked with a vertex set, a priority
   function, and a termination predicate, it yields accepted `[u, v]` edges one at a time in
   acceptance order and stops as soon as the termination predicate is satisfied.
2. Accepted when `algorithms/generation.js`'s `growEdgesStepwise` and `growEdges` are called
   with any inputs valid before the refactor, they yield/return the same edges in the same
   order as before — verified by the existing, unmodified `testGeneration.test.js` suite
   continuing to pass without modification.
3. Accepted when `logic/distance.js`'s exported distance function is called with two vertices,
   it returns their Euclidean distance $\lVert u-v\rVert_2$.
4. Accepted when `algorithms/dijkstra.js`'s generator is run to completion on a vertex set and
   special subset with at least two special vertices, the resulting DSU has every member of
   `specialSubset` sharing one root.
5. Accepted when comparing consecutively accepted edges from `algorithms/dijkstra.js`, each
   newly accepted edge's priority (cumulative distance from its originating special vertex) is
   greater than or equal to every previously accepted edge's priority (monotonic
   non-decreasing distance order — the defining Dijkstra correctness property for
   non-negative edge weights).
6. Accepted when two special vertices become connected by `algorithms/dijkstra.js`'s accepted
   edges, the total weight of the edges connecting them equals the independently/brute-force
   computed shortest-path distance between them at the moment they merge (verified on a small,
   hand-constructed test graph where the true shortest path is known).
7. Accepted when `algorithms/astar.js` is run to completion, the resulting DSU has every
   member of `specialSubset` sharing one root, identically to AC4 for Dijkstra.
8. Accepted when `algorithms/astar.js` is given a heuristic that always returns `0`, it accepts
   the exact same edges in the exact same order as `algorithms/dijkstra.js` given the same
   inputs (A* with a zero heuristic degenerates to Dijkstra).
9. Accepted when `algorithms/astar.js`'s default heuristic is queried for a vertex against the
   current set of not-yet-connected special vertices, it returns the Euclidean distance from
   that vertex to the nearest not-yet-connected special vertex.
10. Accepted when `algorithms/dijkstra.js` or `algorithms/astar.js` is called on a special
    subset with fewer than 2 members (`0` or `1`), the generator terminates immediately,
    yielding no edges (already vacuously connected).

### User Story 6: Multidirectional Shortest-Path Connectivity (Multidirectional Dijkstra + A*)

As a developer extending the graph algorithms layer, I want multidirectional variants of
Dijkstra and A* that search from one independent frontier per special vertex simultaneously,
so that special-vertex connections can be found with less search-space exploration than the
unidirectional versions, while still producing the same drop-in edge-sequence output as every
other algorithm in this layer.

Generalizes two-way bidirectional search to `k` simultaneous origins: each special vertex owns
its own independent frontier/tentative-distance state (unlike Story 5's Dijkstra/A*, which
unify all specials into one shared multi-source queue from the start). All frontiers expand
simultaneously; whenever two different frontiers reach the same vertex, the special-containing
components they originated from merge, using the combined path through that meeting vertex.
Builds on Story 5's primitives (`logic/distance.js`, the default heuristic) and output
contract, and reuses `algorithms/greedyAlgorithm.js` itself as `k` independent single-source
instances (one per special vertex), coordinated by a thin round-robin + meeting-detection
driver local to the multidirectional files (see PLAN.md's Architecture Decisions) — the
acceptance criteria below are black-box/observable and hold regardless of that internal
coordination detail.

**Acceptance criteria**
1. Accepted when `algorithms/multidirectionalDijkstra.js`'s generator is run to completion on a
   vertex set and special subset with at least two special vertices, the resulting DSU has
   every member of `specialSubset` sharing one root.
2. Accepted when `algorithms/multidirectionalDijkstra.js` connects two special-containing
   components, the total weight of the edges connecting them equals the
   independently/brute-force computed shortest-path distance between them, on the same small
   hand-constructed test graphs used for Story 5 AC6.
3. Accepted when `algorithms/multidirectionalDijkstra.js` and `algorithms/dijkstra.js` are run
   on the same inputs, both produce the same total connecting distance between any two special
   vertices that end up directly connected by the algorithm's own edges (multidirectional
   search must not find an inferior/longer connection — same optimality guarantee, though the
   exact edge sequence/order accepted may differ).
4. Accepted when three or more special vertices' frontiers are active at once,
   `algorithms/multidirectionalDijkstra.js` still merges every pair of frontiers that meet,
   continuing until all of `specialSubset` shares one DSU root (not just the first two
   frontiers to meet).
5. Accepted when `algorithms/multidirectionalAstar.js` is run to completion, it satisfies the
   same connectivity (AC1-equivalent) and shortest-distance-correctness (AC2-equivalent)
   guarantees as `algorithms/multidirectionalDijkstra.js`.
6. Accepted when `algorithms/multidirectionalAstar.js` is given a heuristic that always returns
   `0` on every frontier, it produces the same total connecting distances as
   `algorithms/multidirectionalDijkstra.js` given the same inputs.
7. Accepted when either multidirectional algorithm is called on a special subset with fewer
   than 2 members, the generator terminates immediately, yielding no edges.
8. Accepted when either multidirectional algorithm's generator is consumed by `main.js`/
   `rendering/` in place of `algorithms/generation.js` or the unidirectional variants, no
   changes to `main.js` or `rendering/` are needed.

**Explicitly not covered by this story:** the exact round-robin/interleaving order across the
`k` frontiers (e.g. strict alternation vs. always stepping the globally cheapest-next frontier)
— left as an implementation choice, not a fixed contract, as long as the connectivity and
shortest-distance-correctness acceptance criteria above hold.

### User Story 7: Tab-Key Algorithm Switching

As a viewer of the demo, I want to press Tab to switch to the next algorithm and see a freshly
generated graph grown by it, so that I can compare how the different connectivity strategies
introduced by this feature grow a graph.

The project's test suite runs in a plain Node environment (no jsdom), so — consistent with how
`renderer.js`'s timer-driven playback is unit-tested while `main.js`'s `requestAnimationFrame`
loop is not — the algorithm-cycling logic itself must be exposed as a small, pure,
DOM-independent unit (e.g. given the fixed ordered algorithm list and a current index, what the
next index is) that is unit-testable in isolation. The actual `keydown` listener and the
graph-regeneration/render-restart side effects it triggers are untested imperative-shell wiring
in `main.js`, same class of code as the existing render loop.

**Acceptance criteria**
1. Accepted when the demo starts, the active algorithm is `algorithms/generation.js` — first
   in the fixed ordered list (generation, Dijkstra, A*, multidirectional Dijkstra,
   multidirectional A*).
2. Accepted when the pure cycling unit is advanced once from any given algorithm in the fixed
   ordered list, it returns the next algorithm in that list.
3. Accepted when the pure cycling unit is advanced once from the last algorithm in the fixed
   ordered list, it returns the first algorithm (wraps around).
4. Accepted when the Tab key is pressed, a freshly sampled vertex set and special subset are
   generated (not reusing the previous graph's vertices) and passed to the newly selected
   algorithm.
5. Accepted when the Tab key is pressed while a previous graph's stepwise reveal/glow animation
   was mid-playback, the previous render state is fully replaced — no leftover edges, dots, or
   glow from the previous algorithm's graph remain visible.
6. Accepted when any key other than Tab is pressed, the currently displayed algorithm and graph
   are unaffected.

**Explicitly not covered by this story:** the exact visual/DOM wiring of the `keydown` listener
itself (untestable imperative-shell code, verified by manual/visual check rather than an
automated test, same as the existing render loop).

## Assumptions

### Shared skeleton contract
- A1: `algorithms/greedyAlgorithm.js`'s generator, given a priority function and a termination
  predicate, yields accepted `[u, v]` edges one at a time, in acceptance order, and stops
  yielding once the termination predicate holds.
- A2: An accepted pair is never yielded more than once.

### `generation.js` refactor (behavior preservation)
- A3: For any input valid before the refactor, `growEdgesStepwise` and `growEdges` produce the
  same edges, in the same order, as they did before the refactor.

### Euclidean distance primitive
- A4: `logic/distance.js`'s distance function returns the Euclidean distance between two
  vertices, is symmetric, and returns `0` if and only if the two vertices are the same
  position.

### Connectivity termination
- A5: For Dijkstra, A*, and their multidirectional variants, the generator terminates exactly
  when every member of `specialSubset` shares one DSU component — not an edge count or
  sparsity ratio.
- A6: When `specialSubset` has fewer than 2 members, the generator terminates immediately,
  yielding no edges.

### Cross-algorithm distance consistency
- A7: For the same input graph, whenever two special vertices end up connected by any of
  Dijkstra, A*, multidirectional Dijkstra, or multidirectional A*, the total distance of the
  edges connecting them is the same across all of these algorithms — even though the exact set
  of edges chosen to connect them may differ between algorithms.
- A8: That shared connecting distance equals the true (independently verifiable) shortest-path
  distance between the two special vertices.

### A* heuristic behavior
- A9: A* given a heuristic that always returns `0` accepts the same edges, in the same order,
  as Dijkstra on the same input.
- A10: A*'s default heuristic, queried for a vertex, returns the Euclidean distance from that
  vertex to a special node.
- A11: A*'s default heuristic is admissible (never overestimates the true remaining distance
  to the special node it targets) and consistent (satisfies the triangle inequality relative
  to edge weights along any path).
- A12: A*'s heuristic is a caller-supplied input, not fixed — swapping it changes A*'s behavior
  without any other code change.

### Drop-in interface guarantee
- A13: Every algorithm file in `algorithms/` (generation, Dijkstra, A*, multidirectional
  Dijkstra, multidirectional A*) exposes a generator with the same call signature and
  yielded-edge shape.
- A14: `main.js` and `rendering/` consume any algorithm file's generator without needing to
  know which algorithm produced it, and without code changes when swapping between algorithm
  files.

### Algorithm switching (Story 7)
- A15: The ordered algorithm list is fixed for the lifetime of a running demo — switching does
  not add, remove, or reorder entries.
- A16: Each Tab keydown event advances the active algorithm by exactly one step in the list (no
  debouncing beyond the browser's native key-repeat behavior).
- A17: After a switch, the render state contains only vertex, edge, and glow data from the
  newly selected algorithm's newly generated graph — none from any previously active
  algorithm's graph.
