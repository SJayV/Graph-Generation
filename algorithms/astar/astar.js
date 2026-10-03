/** General A*, seeding from an explicit set of initial sources, optionally restricted to an edgeSet. */
import { distance } from "../../logic/computation/distance.js";
import { createShortestPathSearch } from "../shortestPathSearch.js";
import { drainEdges, growEdgesStepwise as _growEdgesStepwise } from "../greedyAlgorithm.js";

// HELPER FUNCTIONS - PRIORITY

function _notYetConnectedSpecials(dsu, specialSubset, vertex) {
  return specialSubset.filter((special) => !dsu.connected(vertex, special));
}

/** Straight-line distance from vertex to the nearest not-yet-connected special vertex. */
function _defaultExtraPriority(vertex, notYetConnectedSpecials) {
  if (notYetConnectedSpecials.length === 0) {
    return 0;
  }
  return Math.min(...notYetConnectedSpecials.map((special) => distance(vertex, special)));
}

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in the order A* finalizes them. */
export function* growEdgesStepwise(allVertices, specialSubset, initialSources, heuristicFunction = _defaultExtraPriority, edgeSet) {
  function extraPriority(vertex, dsu) {
    return heuristicFunction(vertex, _notYetConnectedSpecials(dsu, specialSubset, vertex));
  }

  const { priorityFunction, isStale, onAccept, terminationFunction } = createShortestPathSearch(allVertices, specialSubset, edgeSet, initialSources, extraPriority);

  return yield* _growEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept, isStale);
}

/** Grow edges via A* until every special vertex shares one DSU root. */
export function growEdges(allVertices, specialSubset, initialSources, heuristicFunction = _defaultExtraPriority, edgeSet) {
  return drainEdges(growEdgesStepwise(allVertices, specialSubset, initialSources, heuristicFunction, edgeSet));
}
