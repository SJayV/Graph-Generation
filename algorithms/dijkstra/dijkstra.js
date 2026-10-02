/** General Dijkstra, seeding from an explicit set of initial sources, optionally restricted to an edgeSet. */
import { createShortestPathSearch } from "../shortestPathSearch.js";
import { drainEdges, growEdgesStepwise as _growEdgesStepwise } from "../greedyAlgorithm.js";

// HELPER FUNCTIONS - PRIORITY

function _zeroExtraPriority() {
  return 0;
}

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in the order Dijkstra finalizes them. */
export function* growEdgesStepwise(allVertices, specialSubset, initialSources, edgeSet) {
  const { priorityFunction, isStale, onAccept, terminationFunction } = createShortestPathSearch(allVertices, specialSubset, edgeSet, initialSources, _zeroExtraPriority);

  return yield* _growEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept, isStale);
}

/** Grow edges via Dijkstra until every special vertex shares one DSU root. */
export function growEdges(allVertices, specialSubset, initialSources, edgeSet) {
  return drainEdges(growEdgesStepwise(allVertices, specialSubset, initialSources, edgeSet));
}
