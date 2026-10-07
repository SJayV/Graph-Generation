/** Maps grid positions into WebGL clip space, keeping a screen margin around the content. */
// HELPER FUNCTIONS

function _axisToClipSpace(value, minValue, maxValue, contentClipBound) {
  if (maxValue === minValue) {
    return 0;
  }
  const normalized = (value - minValue) / (maxValue - minValue);
  return normalized * (2 * contentClipBound) - contentClipBound;
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
