/** A*: general, single-source (unidirectional), and multi-source (multidirectional) stepwise variants. */
import { distance } from "../../logic/computation/distance.js";
import { createShortestPathSearch } from "../skeleton/shortestPathSearch.js";
import { createDirectionalVariants } from "../skeleton/directionalSeeding.js";
import { growGreedyEdgesStepwise } from "../skeleton/greedyAlgorithm.js";

// HELPER FUNCTIONS - PRIORITY

function _notYetConnectedSpecials(dsu, specialSubset, vertex) {
  return specialSubset.filter((special) => !dsu.connected(vertex, special));
}

/** Straight-line distance from vertex to the nearest not-yet-connected special vertex. */
function _defaultHeuristic(vertex, notYetConnectedSpecials) {
  if (notYetConnectedSpecials.length === 0) {
    return 0;
  }
  return Math.min(...notYetConnectedSpecials.map((special) => distance(vertex, special)));
}

// HELPER FUNCTIONS - GENERAL SEARCH

/** Yield accepted edges one at a time, in the order A* finalizes them, from an explicit set of initial sources. */
function* _generalGrowEdgesStepwise(allVertices, specialSubset, initialSources, heuristicFunction = _defaultHeuristic, edgeSet) {
  function extraPriority(vertex, dsu) {
    return heuristicFunction(vertex, _notYetConnectedSpecials(dsu, specialSubset, vertex));
  }

  const { priorityFunction, isStale, onAccept, terminationFunction } = createShortestPathSearch(allVertices, specialSubset, edgeSet, initialSources, extraPriority);

  return yield* growGreedyEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept, isStale);
}

// PUBLIC INTERFACE

export const {
  growEdgesUnidirectionalStepwise,
  growEdgesMultidirectionalStepwise,
} = createDirectionalVariants(_generalGrowEdgesStepwise);
