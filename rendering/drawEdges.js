/** Draws a batch of edges as colored line segments; color is resolved per edge by the caller. */
import { positionToClipSpace, uploadClipSpacePositions, uploadVertexColors } from "./glPrimitives.js";

// PUBLIC INTERFACE

export function drawEdges(gl, program, edges, dots, axisBounds, resolveColor) {
  if (edges.length === 0) {
    return;
  }
  const clipSpacePositions = edges.flatMap((edge) => [
    positionToClipSpace(dots[edge.startIndex].position, axisBounds),
    positionToClipSpace(dots[edge.endIndex].position, axisBounds),
  ]);
  const vertexColors = edges.flatMap((edge) => {
    const color = resolveColor(edge);
    return [color, color];
  });
  uploadClipSpacePositions(gl, program, clipSpacePositions);
  uploadVertexColors(gl, program, vertexColors);
  gl.drawArrays(gl.LINES, 0, clipSpacePositions.length);
}
