/** Draws vertex dots, regular and special, as colored circular point sprites. */
import { positionToClipSpace, setColorUniform, uploadClipSpacePositions } from "./glPrimitives.js";

// CONSTANTS

const DOT_COLOR = [0.1, 0.6, 1.0, 1.0];
const SPECIAL_DOT_COLOR = [1.0, 0.55, 0.0, 1.0];
const DOT_POINT_SIZE_PIXELS = 2.0;

// HELPER FUNCTIONS

function _drawDotGroup(gl, program, dots, axisBounds, color) {
  if (dots.length === 0) {
    return;
  }
  const clipSpacePositions = dots.map((dot) => positionToClipSpace(dot.position, axisBounds));
  uploadClipSpacePositions(gl, program, clipSpacePositions);
  setColorUniform(gl, program, color);
  const pointSizeUniformLocation = gl.getUniformLocation(program, "uPointSize");
  gl.uniform1f(pointSizeUniformLocation, DOT_POINT_SIZE_PIXELS);
  gl.drawArrays(gl.POINTS, 0, clipSpacePositions.length);
}

// PUBLIC INTERFACE

export function drawDots(gl, program, renderState, axisBounds) {
  const specialDots = renderState.dots.filter((dot) => dot.position[2]);
  const regularDots = renderState.dots.filter((dot) => !dot.position[2]);
  _drawDotGroup(gl, program, regularDots, axisBounds, DOT_COLOR);
  _drawDotGroup(gl, program, specialDots, axisBounds, SPECIAL_DOT_COLOR);
}
