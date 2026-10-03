/** Dijkstra: general, single-source (unidirectional), and multi-source (multidirectional) stepwise variants. */
import { createShortestPathSearch } from "../skeleton/shortestPathSearch.js";
import { createDirectionalVariants } from "../skeleton/directionalSeeding.js";
import { growEdgesStepwise as _growEdgesStepwise } from "../skeleton/greedyAlgorithm.js";

// HELPER FUNCTIONS - PRIORITY

function _zeroHeuristic() {
  return 0;
}

// HELPER FUNCTIONS - GENERAL SEARCH

/** Yield accepted edges one at a time, in the order Dijkstra finalizes them, from an explicit set of initial sources. */
function* _generalGrowEdgesStepwise(allVertices, specialSubset, initialSources, heuristicFunction = _zeroHeuristic, edgeSet) {
  const { priorityFunction, isStale, onAccept, terminationFunction } = createShortestPathSearch(allVertices, specialSubset, edgeSet, initialSources, heuristicFunction);

  return yield* _growEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept, isStale);
}

// PUBLIC INTERFACE

export const {
  growEdgesUnidirectionalStepwise,
  growEdgesMultidirectionalStepwise,
} = createDirectionalVariants(_generalGrowEdgesStepwise);
