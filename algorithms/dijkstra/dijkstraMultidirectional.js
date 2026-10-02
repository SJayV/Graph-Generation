/** Multidirectional Dijkstra, seeding every special vertex as a simultaneous distance-0 source, optionally restricted to an edgeSet. */
import { growEdgesStepwise as _growEdgesStepwise, growEdges as _growEdges } from "./dijkstra.js";

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in the order multidirectional Dijkstra finalizes them. */
export function growEdgesStepwise(allVertices, specialSubset, edgeSet) {
  return _growEdgesStepwise(allVertices, specialSubset, specialSubset, edgeSet);
}

/** Grow edges via multidirectional Dijkstra until every special vertex shares one DSU root. */
export function growEdges(allVertices, specialSubset, edgeSet) {
  return _growEdges(allVertices, specialSubset, specialSubset, edgeSet);
}
