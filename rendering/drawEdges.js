/** Draws visible edges as glow-blended colored line segments. */
import { positionToClipSpace, uploadClipSpacePositions, uploadVertexColors } from "./glPrimitives.js";

// CONSTANTS

const EDGE_COLOR = [0.0, 0.5, 0.9, 1.0];
const WHITE = [1.0, 1.0, 1.0, 1.0];

// HELPER FUNCTIONS - COLOR

function _mixColor(baseColor, targetColor, weight) {
  return baseColor.map((channel, index) => channel + (targetColor[index] - channel) * weight);
}

function _edgeGlowColor(edge) {
  return _mixColor(EDGE_COLOR, WHITE, edge.glow ?? 0);
}

// PUBLIC INTERFACE

export function drawEdges(gl, program, renderState, axisBounds) {
  if (renderState.visibleEdges.length === 0) {
    return;
  }
  const clipSpacePositions = renderState.visibleEdges.flatMap((edge) => [
    positionToClipSpace(renderState.dots[edge.startIndex].position, axisBounds),
    positionToClipSpace(renderState.dots[edge.endIndex].position, axisBounds),
  ]);
  const vertexColors = renderState.visibleEdges.flatMap((edge) => {
    const color = _edgeGlowColor(edge);
    return [color, color];
  });
  uploadClipSpacePositions(gl, program, clipSpacePositions);
  uploadVertexColors(gl, program, vertexColors);
  gl.drawArrays(gl.LINES, 0, clipSpacePositions.length);
}
