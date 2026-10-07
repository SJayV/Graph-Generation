/** Draws edges as light-beam quads and vertices as point sprites; the edge shader blends in each edge's glow. */
import { positionToClipSpace } from "./coordinateMapping.js";
import { setColorUniform, setFloatUniform, uploadVertexAttribute } from "../program/shaderInputs.js";

// CONSTANTS

const VERTEX_SIZE = 3.0;
const EDGE_MAX_HALF_WIDTH_PIXELS = 10.0;
const QUAD_CORNERS = [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]];
const NOISE_OFFSET_RANGE_PIXELS = 1000;

const POSITION_ATTRIBUTE = { key: "position", attributeName: "aPosition", itemSize: 2 };
const EDGE_ATTRIBUTES = [
  POSITION_ATTRIBUTE,
  { key: "edgeCoordinate", attributeName: "aEdgeCoordinate", itemSize: 2 },
  { key: "noiseAlongPixels", attributeName: "aNoiseAlongPixels", itemSize: 1 },
  { key: "glow", attributeName: "aGlow", itemSize: 1 },
];
const VERTEX_ATTRIBUTES = [POSITION_ATTRIBUTE];

// HELPER FUNCTIONS - SCREEN PIXELS

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

// HELPER FUNCTIONS - EDGE GEOMETRY

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
      noiseAlongPixels: noiseOffset + along * lengthPixels,
      glow: edge.glow ?? 0,
    };
  });
}

// HELPER FUNCTIONS - DRAWING

function _drawGlVertices(gl, program, buffers, { glVertices, attributes, floatUniforms, drawMode }, color) {
  if (glVertices.length === 0) {
    return;
  }
  attributes.forEach(({ key, attributeName, itemSize }) =>
    uploadVertexAttribute(gl, program, buffers[key], attributeName, glVertices.map((glVertex) => glVertex[key]), itemSize),
  );
  setColorUniform(gl, program, color);
  Object.entries(floatUniforms).forEach(([uniformName, value]) => setFloatUniform(gl, program, uniformName, value));
  gl.drawArrays(drawMode, 0, glVertices.length);
}

// PUBLIC INTERFACE

export function drawEdges(gl, program, buffers, edges, vertices, axisBounds, color) {
  const corners = edges.flatMap((edge) => {
    const start = positionToClipSpace(vertices[edge.startIndex].position, axisBounds);
    const end = positionToClipSpace(vertices[edge.endIndex].position, axisBounds);
    return _quadCorners(gl, edge, start, end);
  });
  _drawGlVertices(gl, program, buffers, {glVertices: corners, attributes: EDGE_ATTRIBUTES, floatUniforms: { uEndHalfWidthPixels: VERTEX_SIZE / 2 }, drawMode: gl.TRIANGLES}, color);
}

export function drawVertices(gl, program, buffers, vertices, _unusedVertices, axisBounds, color) {
  const points = vertices.map((vertex) => ({ position: positionToClipSpace(vertex.position, axisBounds) }));
  _drawGlVertices(gl, program, buffers, {glVertices: points, attributes: VERTEX_ATTRIBUTES, floatUniforms: { uPointSize: VERTEX_SIZE * _devicePixelRatio(gl) }, drawMode: gl.POINTS}, color);
}
