/**
 * Minimal raw-WebGL drawing of a render state.
 */

const DOT_VERTEX_SHADER_SOURCE = `
  attribute vec2 aPosition;
  uniform float uPointSize;
  void main() {
    gl_PointSize = uPointSize;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const SOLID_COLOR_FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform vec4 uColor;
  void main() {
    gl_FragColor = uColor;
  }
`;

const DOT_COLOR = [0.1, 0.6, 1.0, 1.0];
const SPECIAL_DOT_COLOR = [1.0, 0.55, 0.0, 1.0];
const EDGE_COLOR = [0.8, 0.8, 0.8, 1.0];
const DOT_POINT_SIZE_PIXELS = 8.0;

function _compileShader(gl, shaderType, sourceCode) {
  const shader = gl.createShader(shaderType);
  gl.shaderSource(shader, sourceCode);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const infoLog = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${infoLog}`);
  }
  return shader;
}

function _createProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = _compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = _compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const infoLog = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program linking failed: ${infoLog}`);
  }
  return program;
}

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
  return ((value - minValue) / (maxValue - minValue)) * 2 - 1;
}

function _positionToClipSpace([x, y], axisBounds) {
  const { minX, maxX, minY, maxY } = axisBounds;
  return [_axisToClipSpace(x, minX, maxX), _axisToClipSpace(y, minY, maxY)];
}

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

function _drawDotGroup(gl, program, dots, axisBounds, color) {
  if (dots.length === 0) {
    return;
  }
  const clipSpacePositions = dots.map((dot) => _positionToClipSpace(dot.position, axisBounds));
  _uploadClipSpacePositions(gl, program, clipSpacePositions);
  const colorUniformLocation = gl.getUniformLocation(program, "uColor");
  gl.uniform4fv(colorUniformLocation, color);
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
  const colorUniformLocation = gl.getUniformLocation(program, "uColor");
  gl.uniform4fv(colorUniformLocation, EDGE_COLOR);
  gl.drawArrays(gl.LINES, 0, clipSpacePositions.length);
}

export function drawRenderState(gl, renderState) {
  const program = _createProgram(
    gl,
    DOT_VERTEX_SHADER_SOURCE,
    SOLID_COLOR_FRAGMENT_SHADER_SOURCE,
  );
  gl.useProgram(program);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.05, 0.05, 0.05, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const axisBounds = _computeAxisBounds(renderState.dots);
  _drawEdges(gl, program, renderState, axisBounds);
  _drawDots(gl, program, renderState, axisBounds);

  gl.deleteProgram(program);
}
