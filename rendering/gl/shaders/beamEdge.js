/** Edge quads as translucent, flaring, meandering bands of light with soft lengthwise color stripes. */
import { FRACTAL_NOISE_SOURCE } from "./noise.js";

// CONSTANTS

const VERTEX_SOURCE = `
  attribute vec2 aPosition;
  attribute vec2 aEdgeCoordinate;
  attribute float aNoiseAlongPixels;
  attribute float aGlow;
  varying vec2 vEdgeCoordinate;
  varying float vNoiseAlongPixels;
  varying float vGlow;
  void main() {
    vEdgeCoordinate = aEdgeCoordinate;
    vNoiseAlongPixels = aNoiseAlongPixels;
    vGlow = aGlow;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SOURCE = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform vec4 uColor;
  uniform float uTime;
  uniform float uEndHalfWidthPixels;
  varying vec2 vEdgeCoordinate;
  varying float vNoiseAlongPixels;
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
  const float DARK_BAND_LEVEL = 0.45;

  ${FRACTAL_NOISE_SOURCE}

  float toSignedUnit(float value) {
    return (value - 0.5) * 2.0;
  }

  void main() {
    vec2 noiseCoordinate = vec2(vNoiseAlongPixels, vEdgeCoordinate.y);
    vec3 fieldPoint = vec3(noiseCoordinate * NOISE_SCALE, uTime * FLOW_SPEED);
    vec2 warp = vec2(fractalNoise(fieldPoint), fractalNoise(fieldPoint + vec3(5.2, 1.3, 2.8)));
    float turbulence = fractalNoise(fieldPoint + WARP_STRENGTH * vec3(warp, 0.0));

    float envelope = sin(PI * vEdgeCoordinate.x);
    float centerline = MEANDER_PIXELS * toSignedUnit(turbulence) * envelope;
    float flare = 1.0 + FLARE_STRENGTH * toSignedUnit(warp.x) * envelope;
    float halfWidth = mix(uEndHalfWidthPixels, MIDDLE_HALF_WIDTH_PIXELS, envelope) * flare;
    float offsetFromCenterline = (vEdgeCoordinate.y - centerline) / max(halfWidth, 0.001);
    float distanceFromCenterline = abs(offsetFromCenterline);

    float core = 1.0 - smoothstep(0.5, 1.0, distanceFromCenterline);
    float halo = HALO_STRENGTH * exp(-HALO_FALLOFF * distanceFromCenterline);
    float coverage = clamp(core + halo, 0.0, 1.0);
    if (coverage < 0.01) {
      discard;
    }

    float bandPhase = offsetFromCenterline / BAND_SPACING - uTime * BAND_FLOW_PER_MILLISECOND;
    float band = 0.5 + 0.5 * sin(2.0 * PI * bandPhase);
    vec3 color = mix(uColor.rgb, vec3(1.0), vGlow);
    gl_FragColor = vec4(color, uColor.a * coverage * 0.6 * mix(DARK_BAND_LEVEL, 1.0, band));
  }
`;

// PUBLIC INTERFACE

export const BEAM_EDGE_SHADER = { vertexSource: VERTEX_SOURCE, fragmentSource: FRAGMENT_SOURCE };
