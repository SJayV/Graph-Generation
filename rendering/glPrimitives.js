/** Shared WebGL coordinate-mapping and buffer-upload primitives for drawing routines. */

// CONSTANTS

const SCREEN_MARGIN_FRACTION = 0.15;
const CONTENT_CLIP_BOUND = 1 - 2 * SCREEN_MARGIN_FRACTION;

// HELPER FUNCTIONS - COORDINATE MAPPING

function _axisToClipSpace(value, minValue, maxValue) {
  if (maxValue === minValue) {
    return 0;
  }
  const normalized = (value - minValue) / (maxValue - minValue);
  return normalized * (2 * CONTENT_CLIP_BOUND) - CONTENT_CLIP_BOUND;
}

// HELPER FUNCTIONS - BUFFER UPLOAD

function _uploadVertexAttribute(gl, program, attributeName, values, itemSize) {
  const attributeLocation = gl.getAttribLocation(program, attributeName);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values.flat()), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attributeLocation);
  gl.vertexAttribPointer(attributeLocation, itemSize, gl.FLOAT, false, 0, 0);
}

// PUBLIC INTERFACE

export function computeAxisBounds(dots) {
  const xValues = dots.map((dot) => dot.position[0]);
  const yValues = dots.map((dot) => dot.position[1]);
  return {
    minX: Math.min(...xValues),
    maxX: Math.max(...xValues),
    minY: Math.min(...yValues),
    maxY: Math.max(...yValues),
  };
}

export function positionToClipSpace([x, y], axisBounds) {
  const { minX, maxX, minY, maxY } = axisBounds;
  return [_axisToClipSpace(x, minX, maxX), _axisToClipSpace(y, minY, maxY)];
}

export function uploadClipSpacePositions(gl, program, clipSpacePositions) {
  _uploadVertexAttribute(gl, program, "aPosition", clipSpacePositions, 2);
}

export function uploadVertexColors(gl, program, vertexColors) {
  _uploadVertexAttribute(gl, program, "aColor", vertexColors, 4);
}

export function setColorUniform(gl, program, color) {
  const colorUniformLocation = gl.getUniformLocation(program, "uColor");
  gl.uniform4fv(colorUniformLocation, color);
}
