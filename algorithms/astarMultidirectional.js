/** Multidirectional A*, seeding every special vertex as a simultaneous distance-0 source, optionally restricted to an edgeSet. */
import { defaultHeuristic } from "../logic/heuristic.js";
import { createShortestPathSearch } from "./shortestPathSearch.js";
import { growEdgesStepwise as _growEdgesStepwise } from "./greedyAlgorithm.js";

// HELPER FUNCTIONS - HEURISTIC

function _notYetConnectedSpecials(dsu, specialSubset, vertex) {
  return specialSubset.filter((special) => !dsu.connected(vertex, special));
}

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in the order multidirectional A* finalizes them. */
export function* growEdgesStepwise(allVertices, specialSubset, heuristicFunction = defaultHeuristic, edgeSet) {
  function extraPriority(vertex, dsu) {
    return heuristicFunction(vertex, _notYetConnectedSpecials(dsu, specialSubset, vertex));
  }

  const { priorityFunction, isStale, onAccept, terminationFunction } = createShortestPathSearch(allVertices, specialSubset, edgeSet, specialSubset, extraPriority);

  return yield* _growEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept, isStale);
}

/** Grow edges via multidirectional A* until every special vertex shares one DSU root. */
export function growEdges(allVertices, specialSubset, heuristicFunction = defaultHeuristic, edgeSet) {
  const generator = growEdgesStepwise(allVertices, specialSubset, heuristicFunction, edgeSet);
  const edges = [];
  let step = generator.next();
  while (!step.done) {
    edges.push(step.value);
    step = generator.next();
  }
  return { edges, dsu: step.value };
}
