/** Deterministic k-nearest-neighbor edge set construction. */
import { distance } from "../computation/distance.js";
import { edgeKey } from "./vertices.js";

// HELPER FUNCTIONS - NEAREST NEIGHBOR SELECTION

function _nearestNeighborsOf(vertex, allVertices, nearestNeighborCount) {
  return allVertices
    .filter((other) => other !== vertex)
    .sort((a, b) => distance(vertex, a) - distance(vertex, b))
    .slice(0, nearestNeighborCount);
}

// PUBLIC INTERFACE

export function buildNearestNeighborEdges(allVertices, nearestNeighborCount) {
  const edgesByKey = new Map();
  for (const vertex of allVertices) {
    for (const neighbor of _nearestNeighborsOf(vertex, allVertices, nearestNeighborCount)) {
      const key = edgeKey(vertex, neighbor);
      if (!edgesByKey.has(key)) {
        edgesByKey.set(key, [vertex, neighbor]);
      }
    }
  }
  return [...edgesByKey.values()];
}
