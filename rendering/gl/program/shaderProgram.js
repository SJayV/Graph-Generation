/** Compiles and links GLSL sources into WebGL programs. */
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

/** Factory for a linked program from a `{ vertexSource, fragmentSource }` shader description. */
export function createShaderProgram(gl, { vertexSource, fragmentSource }) {
  const vertexShader = _compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = _compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  return _linkProgram(gl, vertexShader, fragmentShader);
}
