/** Single-source Dijkstra, starting from one special vertex at a time, optionally restricted to an edgeSet. */
import { growEdgesStepwise as _growEdgesStepwise, growEdges as _growEdges } from "./dijkstra.js";

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in the order Dijkstra finalizes them. */
export function growEdgesStepwise(allVertices, specialSubset, edgeSet) {
  return _growEdgesStepwise(allVertices, specialSubset, undefined, edgeSet);
}

/** Grow edges via Dijkstra until every special vertex shares one DSU root. */
export function growEdges(allVertices, specialSubset, edgeSet) {
  return _growEdges(allVertices, specialSubset, undefined, edgeSet);
}
