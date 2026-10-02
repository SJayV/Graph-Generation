/** Single-source A*, starting from one special vertex at a time, optionally restricted to an edgeSet. */
import { growEdgesStepwise as _growEdgesStepwise, growEdges as _growEdges } from "./astar.js";

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in the order A* finalizes them. */
export function growEdgesStepwise(allVertices, specialSubset, heuristicFunction, edgeSet) {
  return _growEdgesStepwise(allVertices, specialSubset, undefined, heuristicFunction, edgeSet);
}

/** Grow edges via A* until every special vertex shares one DSU root. */
export function growEdges(allVertices, specialSubset, heuristicFunction, edgeSet) {
  return _growEdges(allVertices, specialSubset, undefined, heuristicFunction, edgeSet);
}
