/** Minimal raw-WebGL drawing of a render state. */
import { createCircleProgram, createSolidColorProgram } from "./shaderProgram.js";

// CONSTANTS

const DOT_COLOR = [0.1, 0.6, 1.0, 1.0];
const SPECIAL_DOT_COLOR = [1.0, 0.55, 0.0, 1.0];
const EDGE_COLOR = [0.0, 0.5, 0.9, 1.0];
const DOT_POINT_SIZE_PIXELS = 4.0;
const SCREEN_MARGIN_FRACTION = 0.15;
const CONTENT_CLIP_BOUND = 1 - 2 * SCREEN_MARGIN_FRACTION;

// HELPER FUNCTIONS - COORDINATE MAPPING

function _computeAxisBounds(dots) {
  const xValues = dots.map((dot) => dot.position[0]);
  const yValues = dots.map((dot) => dot.position[1]);
  return {
    minX: Math.min(...xValues),
    maxX: Math.max(...xValues),
    minY: Math.min(...yValues),
    maxY: Math.max(...yValues),
  };
}

function _axisToClipSpace(value, minValue, maxValue) {
  if (maxValue === minValue) {
    return 0;
  }
  const normalized = (value - minValue) / (maxValue - minValue);
  return normalized * (2 * CONTENT_CLIP_BOUND) - CONTENT_CLIP_BOUND;
}

function _positionToClipSpace([x, y], axisBounds) {
  const { minX, maxX, minY, maxY } = axisBounds;
  return [_axisToClipSpace(x, minX, maxX), _axisToClipSpace(y, minY, maxY)];
}

// HELPER FUNCTIONS - DRAWING

function _uploadClipSpacePositions(gl, program, clipSpacePositions) {
  const positionAttributeLocation = gl.getAttribLocation(program, "aPosition");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(clipSpacePositions.flat()),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
}

function _setColorUniform(gl, program, color) {
  const colorUniformLocation = gl.getUniformLocation(program, "uColor");
  gl.uniform4fv(colorUniformLocation, color);
}

function _drawDotGroup(gl, program, dots, axisBounds, color) {
  if (dots.length === 0) {
    return;
  }
  const clipSpacePositions = dots.map((dot) => _positionToClipSpace(dot.position, axisBounds));
  _uploadClipSpacePositions(gl, program, clipSpacePositions);
  _setColorUniform(gl, program, color);
  const pointSizeUniformLocation = gl.getUniformLocation(program, "uPointSize");
  gl.uniform1f(pointSizeUniformLocation, DOT_POINT_SIZE_PIXELS);
  gl.drawArrays(gl.POINTS, 0, clipSpacePositions.length);
}

function _drawDots(gl, program, renderState, axisBounds) {
  const specialDots = renderState.dots.filter((dot) => dot.position[2]);
  const regularDots = renderState.dots.filter((dot) => !dot.position[2]);
  _drawDotGroup(gl, program, regularDots, axisBounds, DOT_COLOR);
  _drawDotGroup(gl, program, specialDots, axisBounds, SPECIAL_DOT_COLOR);
}

function _drawEdges(gl, program, renderState, axisBounds) {
  if (renderState.visibleEdges.length === 0) {
    return;
  }
  const clipSpacePositions = renderState.visibleEdges.flatMap((edge) => [
    _positionToClipSpace(renderState.dots[edge.startIndex].position, axisBounds),
    _positionToClipSpace(renderState.dots[edge.endIndex].position, axisBounds),
  ]);
  _uploadClipSpacePositions(gl, program, clipSpacePositions);
  _setColorUniform(gl, program, EDGE_COLOR);
  gl.drawArrays(gl.LINES, 0, clipSpacePositions.length);
}

// PUBLIC INTERFACE

export function drawRenderState(gl, renderState) {
  const lineProgram = createSolidColorProgram(gl);
  const circleProgram = createCircleProgram(gl);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.05, 0.05, 0.05, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const axisBounds = _computeAxisBounds(renderState.dots);

  gl.useProgram(lineProgram);
  _drawEdges(gl, lineProgram, renderState, axisBounds);

  gl.useProgram(circleProgram);
  _drawDots(gl, circleProgram, renderState, axisBounds);

  gl.deleteProgram(lineProgram);
  gl.deleteProgram(circleProgram);
}
