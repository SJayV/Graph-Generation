/** gl.POINTS as circular sprites with a static radial glow brightening towards the center. */
// CONSTANTS

const VERTEX_SOURCE = `
  attribute vec2 aPosition;
  uniform float uPointSize;
  void main() {
    gl_PointSize = uPointSize;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SOURCE = `
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

// PUBLIC INTERFACE

export const RADIAL_VERTEX_SHADER = { vertexSource: VERTEX_SOURCE, fragmentSource: FRAGMENT_SOURCE };
