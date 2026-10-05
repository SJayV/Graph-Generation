/** Shared WebGL coordinate-mapping and buffer-upload primitives for drawing routines. */
// HELPER FUNCTIONS - COORDINATE MAPPING

function _axisToClipSpace(value, minValue, maxValue, contentClipBound) {
  if (maxValue === minValue) {
    return 0;
  }
  const normalized = (value - minValue) / (maxValue - minValue);
  return normalized * (2 * contentClipBound) - contentClipBound;
}

// HELPER FUNCTIONS - BUFFER UPLOAD

function _uploadVertexAttribute(gl, program, buffer, attributeName, values, itemSize) {
  const attributeLocation = gl.getAttribLocation(program, attributeName);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values.flat()), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(attributeLocation);
  gl.vertexAttribPointer(attributeLocation, itemSize, gl.FLOAT, false, 0, 0);
}

// PUBLIC INTERFACE

export function computeAxisBounds(vertices, screenMarginFraction) {
  const xValues = vertices.map((vertex) => vertex.position[0]);
  const yValues = vertices.map((vertex) => vertex.position[1]);
  return {
    minX: Math.min(...xValues),
    maxX: Math.max(...xValues),
    minY: Math.min(...yValues),
    maxY: Math.max(...yValues),
    contentClipBound: 1 - 2 * screenMarginFraction,
  };
}

export function positionToClipSpace([x, y], axisBounds) {
  const { minX, maxX, minY, maxY, contentClipBound } = axisBounds;
  return [_axisToClipSpace(x, minX, maxX, contentClipBound), _axisToClipSpace(y, minY, maxY, contentClipBound)];
}

export function uploadClipSpacePositions(gl, program, buffer, clipSpacePositions) {
  _uploadVertexAttribute(gl, program, buffer, "aPosition", clipSpacePositions, 2);
}

export function uploadVertexGlow(gl, program, buffer, glowValues) {
  _uploadVertexAttribute(gl, program, buffer, "aGlow", glowValues, 1);
}

export function uploadEdgeCoordinates(gl, program, buffer, edgeCoordinates) {
  _uploadVertexAttribute(gl, program, buffer, "aEdgeCoordinate", edgeCoordinates, 2);
}

export function uploadNoiseCoordinates(gl, program, buffer, noiseCoordinates) {
  _uploadVertexAttribute(gl, program, buffer, "aNoiseCoordinate", noiseCoordinates, 2);
}

export function setFloatUniform(gl, program, uniformName, value) {
  const uniformLocation = gl.getUniformLocation(program, uniformName);
  gl.uniform1f(uniformLocation, value);
}

export function setColorUniform(gl, program, color) {
  const colorUniformLocation = gl.getUniformLocation(program, "uColor");
  gl.uniform4fv(colorUniformLocation, color);
}
