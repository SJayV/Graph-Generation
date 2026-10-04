/** Deterministic k-nearest-neighbor edge set construction. */
import { distance } from "../computation/distance.js";
import { edgeKey } from "./vertices.js";
import { NEAREST_NEIGHBOR_COUNT } from "../../parameters.js";

// HELPER FUNCTIONS - NEAREST NEIGHBOR SELECTION

function _nearestNeighborsOf(vertex, allVertices) {
  return allVertices
    .filter((other) => other !== vertex)
    .sort((a, b) => distance(vertex, a) - distance(vertex, b))
    .slice(0, NEAREST_NEIGHBOR_COUNT);
}

// PUBLIC INTERFACE

export function buildNearestNeighborEdges(allVertices) {
  const edgesByKey = new Map();
  for (const vertex of allVertices) {
    for (const neighbor of _nearestNeighborsOf(vertex, allVertices)) {
      const key = edgeKey(vertex, neighbor);
      if (!edgesByKey.has(key)) {
        edgesByKey.set(key, [vertex, neighbor]);
      }
    }
  }
  return [...edgesByKey.values()];
}
