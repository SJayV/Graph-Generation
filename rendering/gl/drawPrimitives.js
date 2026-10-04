/** Draws edges or vertices; the shader blends in each vertex's glow. */
import { positionToClipSpace, setColorUniform, uploadClipSpacePositions, uploadVertexGlow } from "./glPrimitives.js";

// CONSTANTS

const VERTEX_SIZE = 2.0;

// PUBLIC INTERFACE

export function drawEdges(gl, program, buffers, edges, vertices, axisBounds, color) {
  if (edges.length === 0) {
    return;
  }
  const clipSpacePositions = edges.flatMap((edge) => [
    positionToClipSpace(vertices[edge.startIndex].position, axisBounds),
    positionToClipSpace(vertices[edge.endIndex].position, axisBounds),
  ]);
  const glowValues = edges.flatMap((edge) => {
    const glow = edge.glow ?? 0;
    return [glow, glow];
  });
  uploadClipSpacePositions(gl, program, buffers.position, clipSpacePositions);
  uploadVertexGlow(gl, program, buffers.glow, glowValues);
  setColorUniform(gl, program, color);
  gl.drawArrays(gl.LINES, 0, clipSpacePositions.length);
}

export function drawVertices(gl, program, buffers, vertices, _unusedVertices, axisBounds, color) {
  if (vertices.length === 0) {
    return;
  }
  const clipSpacePositions = vertices.map((vertex) => positionToClipSpace(vertex.position, axisBounds));
  uploadClipSpacePositions(gl, program, buffers.position, clipSpacePositions);
  setColorUniform(gl, program, color);
  const pointSizeUniformLocation = gl.getUniformLocation(program, "uPointSize");
  gl.uniform1f(pointSizeUniformLocation, VERTEX_SIZE);
  gl.drawArrays(gl.POINTS, 0, clipSpacePositions.length);
}
