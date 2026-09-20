/** Top-level draw orchestrator: wires shader programs and dot/edge drawing into one frame. */
import { computeAxisBounds } from "./glPrimitives.js";
import { drawDots } from "./drawDots.js";
import { drawEdges } from "./drawEdges.js";
import { createCircleProgram, createColorProgram } from "./shaderProgram.js";

// PUBLIC INTERFACE

export function drawRenderState(gl, renderState) {
  const edgeProgram = createColorProgram(gl);
  const circleProgram = createCircleProgram(gl);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.05, 0.05, 0.05, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const axisBounds = computeAxisBounds(renderState.dots);

  gl.useProgram(edgeProgram);
  drawEdges(gl, edgeProgram, renderState, axisBounds);

  gl.useProgram(circleProgram);
  drawDots(gl, circleProgram, renderState, axisBounds);

  gl.deleteProgram(edgeProgram);
  gl.deleteProgram(circleProgram);
}
