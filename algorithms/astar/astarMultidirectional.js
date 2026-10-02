/** Multidirectional A*, seeding every special vertex as a simultaneous distance-0 source, optionally restricted to an edgeSet. */
import { growEdgesStepwise as _growEdgesStepwise, growEdges as _growEdges } from "./astar.js";

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in the order multidirectional A* finalizes them. */
export function growEdgesStepwise(allVertices, specialSubset, heuristicFunction, edgeSet) {
  return _growEdgesStepwise(allVertices, specialSubset, specialSubset, heuristicFunction, edgeSet);
}

/** Grow edges via multidirectional A* until every special vertex shares one DSU root. */
export function growEdges(allVertices, specialSubset, heuristicFunction, edgeSet) {
  return _growEdges(allVertices, specialSubset, specialSubset, heuristicFunction, edgeSet);
}
