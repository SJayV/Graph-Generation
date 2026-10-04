/** Samples a fresh vertex set, special subset, and candidate edge set for a single demo graph. */
import { buildNearestNeighborEdges } from "./logic/randomness/edges.js";
import { createSeededRng } from "./logic/randomness/rng.js";
import { sampleVertices, selectSpecialSubset, vertexKey } from "./logic/randomness/vertices.js";
import { GRID_SIZE, SPECIAL_SUBSET_SIZE, VERTEX_COUNT } from "./parameters.js";

// HELPER FUNCTIONS

function _createEntropySeed() {
  return Math.floor(Math.random() * 0xffffffff);
}

// PUBLIC INTERFACE

export function createGraph() {
  const rng = createSeededRng(_createEntropySeed());
  const allVertices = sampleVertices(VERTEX_COUNT, GRID_SIZE, rng);
  const specialSubset = selectSpecialSubset(allVertices, SPECIAL_SUBSET_SIZE, rng);
  const edgeSet = buildNearestNeighborEdges(allVertices);
  return { allVertices, specialSubset, edgeSet };
}

/** Marks each vertex of allVertices with whether it belongs to specialSubset, for rendering. */
export function markSpecial(allVertices, specialSubset) {
  const specialKeys = new Set(specialSubset.map(vertexKey));
  return allVertices.map(([x, y]) => [x, y, specialKeys.has(vertexKey([x, y]))]);
}

/** Converts vertex-coordinate edge pairs into index pairs into allVertices, for rendering. */
export function toIndexEdges(allVertices, vertexPairs) {
  const indexByKey = new Map(allVertices.map((vertex, index) => [vertexKey(vertex), index]));
  return vertexPairs.map(([u, v]) => [indexByKey.get(vertexKey(u)), indexByKey.get(vertexKey(v))]);
}
