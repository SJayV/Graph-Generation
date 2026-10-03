/** Top-level draw orchestrator: wires shader programs and dot/edge drawing into one frame. */
import { computeAxisBounds } from "./glPrimitives.js";
import { drawDots } from "./drawDots.js";
import { drawEdges } from "./drawEdges.js";
import { createCircleProgram, createColorProgram } from "./shaderProgram.js";

// CONSTANTS

const EDGE_COLOR = [0.0, 0.5, 0.9, 1.0];
const HIGHLIGHT_COLOR = [1.0, 0.55, 0.0, 1.0];
const WHITE = [1.0, 1.0, 1.0, 1.0];
const BASELINE_EDGE_COLOR = [0.0, 0.1, 0.3, 1.0];

// HELPER FUNCTIONS - COLOR DECORATORS

function _mixColor(baseColor, targetColor, weight) {
  return baseColor.map((channel, index) => channel + (targetColor[index] - channel) * weight);
}

function _highlightColor(edge) {
  const baseColor = edge.category === "highlight" ? HIGHLIGHT_COLOR : EDGE_COLOR;
  return _mixColor(baseColor, WHITE, edge.glow ?? 0);
}

// PUBLIC INTERFACE

export function drawRenderState(gl, renderState) {
  const edgeProgram = createColorProgram(gl);
  const circleProgram = createCircleProgram(gl);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.05, 0.05, 0.05, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const axisBounds = computeAxisBounds(renderState.dots);

  gl.useProgram(edgeProgram);
  drawEdges(gl, edgeProgram, renderState.baselineEdges, renderState.dots, axisBounds, () => BASELINE_EDGE_COLOR);
  drawEdges(gl, edgeProgram, renderState.visibleEdges, renderState.dots, axisBounds, _highlightColor);

  gl.useProgram(circleProgram);
  drawDots(gl, circleProgram, renderState, axisBounds);

  gl.deleteProgram(edgeProgram);
  gl.deleteProgram(circleProgram);
}
