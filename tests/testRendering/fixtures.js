/**
 * Shared test fixtures for the rendering-layer test suite.
 *
 * Assumed data shapes (mirroring the JSON exported by the logic layer, per
 * AGENTS.md's Architecture Map: "logic layer exports a static JSON file
 * (vertices, ordered edge-addition sequence)"):
 *
 *   vertex   := [x, y]                 // integer grid coordinates
 *   edge     := [startIndex, endIndex] // indices into the vertices array
 *
 * These are intentionally plain data (no classes), matching the Python side's
 * use of plain tuples/frozensets for vertices/edges.
 */

export function makeVertices(count) {
  const vertices = [];
  for (let index = 0; index < count; index += 1) {
    vertices.push([index, 0]);
  }
  return vertices;
}

export function makeLinearEdgeSequence(vertexCount) {
  const edgeSequence = [];
  for (let index = 0; index < vertexCount - 1; index += 1) {
    edgeSequence.push([index, index + 1]);
  }
  return edgeSequence;
}
