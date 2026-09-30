/** Single-source Dijkstra, starting from one special vertex at a time, optionally restricted to an edgeSet. */
import { createShortestPathSearch } from "./shortestPathSearch.js";
import { growEdgesStepwise as _growEdgesStepwise } from "./greedyAlgorithm.js";

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in the order Dijkstra finalizes them. */
export function* growEdgesStepwise(allVertices, specialSubset, edgeSet) {
  const { priorityFunction, isStale, onAccept, terminationFunction } = createShortestPathSearch(allVertices, specialSubset, edgeSet);

  return yield* _growEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept, isStale);
}

/** Grow edges via Dijkstra until every special vertex shares one DSU root. */
export function growEdges(allVertices, specialSubset, edgeSet) {
  const generator = growEdgesStepwise(allVertices, specialSubset, edgeSet);
  const edges = [];
  let step = generator.next();
  while (!step.done) {
    edges.push(step.value);
    step = generator.next();
  }
  return { edges, dsu: step.value };
}
