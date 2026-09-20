// CONSTANTS

const GAMMA_RATE = 2;
const SCALE = 25.0;

// HELPER FUNCTIONS

function _gammaSurvival(x) {
  const scaledX = GAMMA_RATE * x;
  return (1 + scaledX) * Math.exp(-scaledX);
}

// PUBLIC INTERFACE

export function computeGlow(elapsedTime, referenceInterval) {
  elapsedTime /= referenceInterval * SCALE;
  return _gammaSurvival(elapsedTime);
}
