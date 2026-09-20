/** WebGL shader compilation and program linking for dot/line rendering. */

// CONSTANTS

const POSITION_VERTEX_SHADER_SOURCE = `
  attribute vec2 aPosition;
  uniform float uPointSize;
  void main() {
    gl_PointSize = uPointSize;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const COLOR_VERTEX_SHADER_SOURCE = `
  attribute vec2 aPosition;
  attribute vec4 aColor;
  varying vec4 vColor;
  void main() {
    vColor = aColor;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const COLOR_FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  varying vec4 vColor;
  void main() {
    gl_FragColor = vColor;
  }
`;

const CIRCLE_FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform vec4 uColor;
  void main() {
    vec2 offsetFromCenter = gl_PointCoord - vec2(0.5, 0.5);
    if (length(offsetFromCenter) > 0.5) {
      discard;
    }
    gl_FragColor = uColor;
  }
`;

// HELPER FUNCTIONS

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

function _linkProgram(gl, vertexShader, fragmentShader) {
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

// PUBLIC INTERFACE
export function createColorProgram(gl) {
  const vertexShader = _compileShader(gl, gl.VERTEX_SHADER, COLOR_VERTEX_SHADER_SOURCE);
  const fragmentShader = _compileShader(gl, gl.FRAGMENT_SHADER, COLOR_FRAGMENT_SHADER_SOURCE);
  return _linkProgram(gl, vertexShader, fragmentShader);
}

/** Renders gl.POINTS as circular sprites by discarding fragments outside the point's radius. */
export function createCircleProgram(gl) {
  const vertexShader = _compileShader(gl, gl.VERTEX_SHADER, POSITION_VERTEX_SHADER_SOURCE);
  const fragmentShader = _compileShader(gl, gl.FRAGMENT_SHADER, CIRCLE_FRAGMENT_SHADER_SOURCE);
  return _linkProgram(gl, vertexShader, fragmentShader);
}
