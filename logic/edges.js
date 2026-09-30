/** Deterministic k-nearest-neighbor edge set construction, no RNG. */
import { distance } from "./distance.js";
import { vertexKey } from "./vertices.js";

// CONSTANTS

const NEAREST_NEIGHBOR_COUNT = 4;

// HELPER FUNCTIONS - NEAREST NEIGHBOR SELECTION

function _nearestNeighborsOf(vertex, allVertices) {
  return allVertices
    .filter((other) => other !== vertex)
    .sort((a, b) => distance(vertex, a) - distance(vertex, b))
    .slice(0, NEAREST_NEIGHBOR_COUNT);
}

// PUBLIC INTERFACE

/** Canonical, order-independent key for an unordered vertex pair. */
export function edgeKey(u, v) {
  const [a, b] = [vertexKey(u), vertexKey(v)].sort();
  return `${a}|${b}`;
}

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
