/** Draws edges as light-beam quads and vertices as point sprites; the edge shader blends in each edge's glow. */
import { positionToClipSpace, setColorUniform, setFloatUniform, uploadClipSpacePositions, uploadEdgeCoordinates, uploadNoiseCoordinates, uploadVertexGlow } from "./glPrimitives.js";

// CONSTANTS

const VERTEX_SIZE = 3.0;
const EDGE_MAX_HALF_WIDTH_PIXELS = 10.0;
const QUAD_CORNERS = [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]];
const NOISE_OFFSET_RANGE_PIXELS = 1000;

// HELPER FUNCTIONS - EDGE GEOMETRY

function _devicePixelRatio(gl) {
  return gl.drawingBufferWidth / gl.canvas.clientWidth;
}

function _pixelGeometry(gl, start, end) {
  const halfWidthPixels = gl.canvas.clientWidth / 2;
  const halfHeightPixels = gl.canvas.clientHeight / 2;
  const deltaX = (end[0] - start[0]) * halfWidthPixels;
  const deltaY = (end[1] - start[1]) * halfHeightPixels;
  const lengthPixels = Math.hypot(deltaX, deltaY) || 1;
  const perpendicularOffset = [
    ((-deltaY / lengthPixels) * EDGE_MAX_HALF_WIDTH_PIXELS) / halfWidthPixels,
    ((deltaX / lengthPixels) * EDGE_MAX_HALF_WIDTH_PIXELS) / halfHeightPixels,
  ];
  return { lengthPixels, perpendicularOffset };
}

function _noiseOffset(edge) {
  return (edge.startIndex * 7919 + edge.endIndex * 104729) % NOISE_OFFSET_RANGE_PIXELS;
}

function _quadCorners(gl, edge, start, end) {
  const { lengthPixels, perpendicularOffset } = _pixelGeometry(gl, start, end);
  const noiseOffset = _noiseOffset(edge);
  return QUAD_CORNERS.map(([along, across]) => {
    const anchor = along === 0 ? start : end;
    return {
      position: [anchor[0] + perpendicularOffset[0] * across, anchor[1] + perpendicularOffset[1] * across],
      edgeCoordinate: [along, across * EDGE_MAX_HALF_WIDTH_PIXELS],
      noiseCoordinate: [noiseOffset + along * lengthPixels, across * EDGE_MAX_HALF_WIDTH_PIXELS],
      glow: edge.glow ?? 0,
    };
  });
}

// PUBLIC INTERFACE

export function drawEdges(gl, program, buffers, edges, vertices, axisBounds, color) {
  if (edges.length === 0) {
    return;
  }
  const corners = edges.flatMap((edge) => {
    const start = positionToClipSpace(vertices[edge.startIndex].position, axisBounds);
    const end = positionToClipSpace(vertices[edge.endIndex].position, axisBounds);
    return _quadCorners(gl, edge, start, end);
  });
  uploadClipSpacePositions(gl, program, buffers.position, corners.map((corner) => corner.position));
  uploadEdgeCoordinates(gl, program, buffers.edgeCoordinate, corners.map((corner) => corner.edgeCoordinate));
  uploadNoiseCoordinates(gl, program, buffers.noiseCoordinate, corners.map((corner) => corner.noiseCoordinate));
  uploadVertexGlow(gl, program, buffers.glow, corners.map((corner) => corner.glow));
  setColorUniform(gl, program, color);
  setFloatUniform(gl, program, "uEndHalfWidthPixels", VERTEX_SIZE / 2);
  gl.drawArrays(gl.TRIANGLES, 0, corners.length);
}

export function drawVertices(gl, program, buffers, vertices, _unusedVertices, axisBounds, color) {
  if (vertices.length === 0) {
    return;
  }
  const clipSpacePositions = vertices.map((vertex) => positionToClipSpace(vertex.position, axisBounds));
  uploadClipSpacePositions(gl, program, buffers.position, clipSpacePositions);
  setColorUniform(gl, program, color);
  setFloatUniform(gl, program, "uPointSize", VERTEX_SIZE * _devicePixelRatio(gl));
  gl.drawArrays(gl.POINTS, 0, clipSpacePositions.length);
}
