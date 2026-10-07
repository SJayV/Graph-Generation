/** GLSL chunk: 3D value noise and its fractal sum, for inclusion in fragment shaders. */
// PUBLIC INTERFACE

export const FRACTAL_NOISE_SOURCE = `
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
`;
