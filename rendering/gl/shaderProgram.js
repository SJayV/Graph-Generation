// CONSTANTS

const POSITION_VERTEX_SHADER_SOURCE = `
  attribute vec2 aPosition;
  uniform float uPointSize;
  void main() {
    gl_PointSize = uPointSize;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const BEAM_VERTEX_SHADER_SOURCE = `
  attribute vec2 aPosition;
  attribute vec2 aEdgeCoordinate;
  attribute vec2 aNoiseCoordinate;
  attribute float aGlow;
  varying vec2 vEdgeCoordinate;
  varying vec2 vNoiseCoordinate;
  varying float vGlow;
  void main() {
    vEdgeCoordinate = aEdgeCoordinate;
    vNoiseCoordinate = aNoiseCoordinate;
    vGlow = aGlow;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const BEAM_FRAGMENT_SHADER_SOURCE = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform vec4 uColor;
  uniform float uTime;
  uniform float uEndHalfWidthPixels;
  varying vec2 vEdgeCoordinate;
  varying vec2 vNoiseCoordinate;
  varying float vGlow;

  const float PI = 3.14159265;
  const float NOISE_SCALE = 0.06;
  const float FLOW_SPEED = 0.0004;
  const float WARP_STRENGTH = 1.8;
  const float MIDDLE_HALF_WIDTH_PIXELS = 3.0;
  const float FLARE_STRENGTH = 0.9;
  const float MEANDER_PIXELS = 3.0;
  const float HALO_STRENGTH = 0.35;
  const float HALO_FALLOFF = 2.5;
  const float BAND_SPACING = 1.6;
  const float BAND_FLOW_PER_MILLISECOND = 0.00005;
  const float DARK_BAND_LEVEL = 0.6;

  float hash(vec3 point) {
    return fract(sin(dot(point, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  float valueNoise(vec3 point) {
    vec3 cell = floor(point);
    vec3 local = fract(point);
    vec3 smoothed = local * local * (3.0 - 2.0 * local);
    float bottomFront = mix(hash(cell), hash(cell + vec3(1.0, 0.0, 0.0)), smoothed.x);
    float topFront = mix(hash(cell + vec3(0.0, 1.0, 0.0)), hash(cell + vec3(1.0, 1.0, 0.0)), smoothed.x);
    float bottomBack = mix(hash(cell + vec3(0.0, 0.0, 1.0)), hash(cell + vec3(1.0, 0.0, 1.0)), smoothed.x);
    float topBack = mix(hash(cell + vec3(0.0, 1.0, 1.0)), hash(cell + vec3(1.0, 1.0, 1.0)), smoothed.x);
    return mix(mix(bottomFront, topFront, smoothed.y), mix(bottomBack, topBack, smoothed.y), smoothed.z);
  }

  float fractalNoise(vec3 point) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 5; octave++) {
      sum += amplitude * valueNoise(point);
      point = point * 2.03 + vec3(1.7, 9.2, 0.0);
      amplitude *= 0.5;
    }
    return sum;
  }

  void main() {
    vec3 fieldPoint = vec3(vNoiseCoordinate * NOISE_SCALE, uTime * FLOW_SPEED);
    vec2 warp = vec2(fractalNoise(fieldPoint), fractalNoise(fieldPoint + vec3(5.2, 1.3, 2.8)));
    float turbulence = fractalNoise(fieldPoint + WARP_STRENGTH * vec3(warp, 0.0));

    float envelope = sin(PI * vEdgeCoordinate.x);
    float centerline = MEANDER_PIXELS * (turbulence - 0.5) * 2.0 * envelope;
    float flare = 1.0 + FLARE_STRENGTH * (warp.x - 0.5) * 2.0 * envelope;
    float halfWidth = mix(uEndHalfWidthPixels, MIDDLE_HALF_WIDTH_PIXELS, envelope) * flare;
    float distanceFromCenterline = abs(vEdgeCoordinate.y - centerline) / max(halfWidth, 0.001);

    float core = 1.0 - smoothstep(0.5, 1.0, distanceFromCenterline);
    float halo = HALO_STRENGTH * exp(-HALO_FALLOFF * distanceFromCenterline);
    float coverage = clamp(core + halo, 0.0, 1.0);
    if (coverage < 0.01) {
      discard;
    }

    float acrossBand = (vEdgeCoordinate.y - centerline) / max(halfWidth, 0.001);
    float bandPhase = acrossBand / BAND_SPACING - uTime * BAND_FLOW_PER_MILLISECOND;
    float band = 0.5 + 0.5 * sin(2.0 * PI * bandPhase);
    vec3 color = mix(uColor.rgb * mix(DARK_BAND_LEVEL, 1.0, band), vec3(1.0), vGlow);
    gl_FragColor = vec4(color, uColor.a * coverage * mix(0.45, 0.6, band));
  }
`;

const CIRCLE_FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform vec4 uColor;

  const float CENTER_BRIGHTENING = 0.6;

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5, 0.5)) * 2.0;
    if (radius > 1.0) {
      discard;
    }
    vec3 color = mix(uColor.rgb, vec3(1.0), (1.0 - radius) * CENTER_BRIGHTENING);
    gl_FragColor = vec4(color, uColor.a);
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

/** Renders edge quads as translucent, flaring, meandering bands of light with soft lengthwise color stripes. */
export function createBeamProgram(gl) {
  const vertexShader = _compileShader(gl, gl.VERTEX_SHADER, BEAM_VERTEX_SHADER_SOURCE);
  const fragmentShader = _compileShader(gl, gl.FRAGMENT_SHADER, BEAM_FRAGMENT_SHADER_SOURCE);
  return _linkProgram(gl, vertexShader, fragmentShader);
}

/** Renders gl.POINTS as circular sprites by discarding fragments outside the point's radius. */
export function createCircleProgram(gl) {
  const vertexShader = _compileShader(gl, gl.VERTEX_SHADER, POSITION_VERTEX_SHADER_SOURCE);
  const fragmentShader = _compileShader(gl, gl.FRAGMENT_SHADER, CIRCLE_FRAGMENT_SHADER_SOURCE);
  return _linkProgram(gl, vertexShader, fragmentShader);
}
