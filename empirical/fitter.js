/** Gradient-descent fit of a sigmoid to (r, proportion) data. */

// CONSTANTS

export const MAX_ITERATIONS = 20000;
export const GRADIENT_TOLERANCE = 1e-8;
export const LEARNING_RATE = 1.0;

// HELPER FUNCTIONS - SIGMOID

function _sigmoidValue(r, k, r0) {
  const exponent = -k * (r - r0);
  if (exponent >= 0) {
    const shrunkExponential = Math.exp(-exponent);
    return shrunkExponential / (1.0 + shrunkExponential);
  }
  return 1.0 / (1.0 + Math.exp(exponent));
}

// HELPER FUNCTIONS - LOSS DERIVATIVES

function _gradient(dataPoints, k, r0) {
  let gradientWithRespectToK = 0.0;
  let gradientWithRespectToR0 = 0.0;
  for (const [r, proportion] of dataPoints) {
    const predicted = _sigmoidValue(r, k, r0);
    const errorTimesSlope = 2.0 * (predicted - proportion) * predicted * (1.0 - predicted);
    gradientWithRespectToK += errorTimesSlope * (r - r0);
    gradientWithRespectToR0 += errorTimesSlope * -k;
  }
  return [gradientWithRespectToK, gradientWithRespectToR0];
}

// PUBLIC INTERFACE

export function fitSigmoid(dataPoints) {
  const rValues = dataPoints.map(([r]) => r);
  let r0 = (Math.min(...rValues) + Math.max(...rValues)) / 2.0;
  let k = 1.0;

  const pointCount = dataPoints.length;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
    const [gradientWithRespectToK, gradientWithRespectToR0] = _gradient(dataPoints, k, r0);
    const gradientNorm = Math.hypot(gradientWithRespectToK, gradientWithRespectToR0);
    if (gradientNorm < GRADIENT_TOLERANCE) {
      break;
    }

    const stepScale = LEARNING_RATE / pointCount;
    k -= stepScale * gradientWithRespectToK;
    r0 -= stepScale * gradientWithRespectToR0;
  }

  return [k, r0];
}
