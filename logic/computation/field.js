/** Gaussian-field priority score used by the greedy edge-growth algorithm. */

// HELPER FUNCTIONS - STRENGTH CALCULATION

function _strength(dsu, vertex, x, dampeningFactor) {
  const appliedDampening = dsu.connected(vertex, x) ? dampeningFactor : 1;
  return Math.sqrt(appliedDampening * (dsu.componentSize(vertex)));
}

// HELPER FUNCTIONS - FIELD VALUE

function _fieldValue(dsu, vertex, x, fieldShape) {
  const strengtheningFactor = dsu.isSpecial(vertex) ? fieldShape.strengtheningFactor : 1.0;
  return strengtheningFactor * _strength(dsu, vertex, x, fieldShape.dampeningFactor) * gaussian(x, vertex, fieldShape.sigma);
}

// PUBLIC INTERFACE

/** Unnormalized isotropic 2D Gaussian bump centred at mu. */
export function gaussian(x, mu, sigma) {
  const squaredDistance = (x[0] - mu[0]) ** 2 + (x[1] - mu[1]) ** 2;
  return Math.exp(-squaredDistance / (2 * sigma * sigma));
}

export function sigma(vertexCount, gridSize) {
  return gridSize / Math.sqrt(vertexCount);
}

/** Symmetric priority score for the unordered pair {u, v}. */
export function key(dsu, u, v, fieldShape) {
  const fieldOfVAtU = _fieldValue(dsu, v, u, fieldShape);
  const fieldOfUAtV = _fieldValue(dsu, u, v, fieldShape);
  return fieldOfVAtU + fieldOfUAtV;
}
