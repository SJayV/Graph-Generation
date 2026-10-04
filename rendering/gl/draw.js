/** Top-level draw orchestrator: wires shader programs and dot/edge drawing into one frame. */
import { computeAxisBounds } from "./glPrimitives.js";
import { drawEdges, drawVertices } from "./drawPrimitives.js";
import { createCircleProgram, createColorProgram } from "./shaderProgram.js";

// CONSTANTS

const COLOR_BY_CATEGORY = {
  normal: [0.0, 0.5, 0.9, 1.0],
  special: [1.0, 0.55, 0.0, 1.0],
  background: [0.0, 0.1, 0.3, 1.0],
};

const EDGE_CATEGORIES = ["background", "normal", "special"];
const VERTEX_CATEGORIES = ["normal", "special"];

// HELPER FUNCTIONS - CATEGORIZATION

function _inCategory(items, category) {
  return items.filter((item) => item.category === category);
}

// HELPER FUNCTIONS - DRAWING

function _clear(gl) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.05, 0.05, 0.05, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function _drawPrimitiveCategory(gl, program, buffers, drawFunction, field, renderState, axisBounds, category) {
  gl.useProgram(program);
  drawFunction(gl, program, buffers, _inCategory(renderState[field], category), renderState.vertices, axisBounds, COLOR_BY_CATEGORY[category]);
}

// PUBLIC INTERFACE

/** Compiles the shader programs and allocates the vertex buffers once; reuse the result across frames. */
export function createDrawResources(gl) {
  return {
    edgeProgram: createColorProgram(gl),
    circleProgram: createCircleProgram(gl),
    buffers: { position: gl.createBuffer(), glow: gl.createBuffer() },
  };
}

export function drawRenderState(gl, resources, renderState, screenMarginFraction) {
  const { edgeProgram, circleProgram, buffers } = resources;
  const axisBounds = computeAxisBounds(renderState.vertices, screenMarginFraction);

  _clear(gl);
  EDGE_CATEGORIES.forEach((category) => _drawPrimitiveCategory(gl, edgeProgram, buffers, drawEdges, "edges", renderState, axisBounds, category));
  VERTEX_CATEGORIES.forEach((category) => _drawPrimitiveCategory(gl, circleProgram, buffers, drawVertices, "vertices", renderState, axisBounds, category));
}
