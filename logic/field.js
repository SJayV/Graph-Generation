/** Gaussian-field priority score used by the greedy edge-growth algorithm. */
import { vertexKey } from "./vertices.js";

// CONSTANTS

const DAMPENING_FACTOR = 0.1;
const STRENGTHENING_FACTOR = 10.0;

// HELPER FUNCTIONS - STRENGTH CALCULATION

function _sameComponent(dsu, a, b) {
  const rootA = dsu.find(a);
  const rootB = dsu.find(b);
  if (rootA === undefined || rootB === undefined) {
    return false;
  }
  return vertexKey(rootA) === vertexKey(rootB);
}

function _strength(dsu, vertex, x) {
  const dampeningFactor = _sameComponent(dsu, vertex, x) ? DAMPENING_FACTOR : 1;
  return Math.sqrt(dampeningFactor * (dsu.componentSize(vertex)));
}

// PUBLIC INTERFACE

/** Unnormalized isotropic 2D Gaussian bump centred at mu. */
export function gaussian(x, mu, sigma) {
  const squaredDistance = (x[0] - mu[0]) ** 2 + (x[1] - mu[1]) ** 2;
  return Math.exp(-squaredDistance / (2 * sigma * sigma));
}

/** Strength-scaled Gaussian bump centred on `vertex`, evaluated at x. */
export function fieldValue(dsu, vertex, x, sigma) {
  const strengtheningFactor = dsu.isSpecial(vertex) ? STRENGTHENING_FACTOR : 1.0;
  return strengtheningFactor * _strength(dsu, vertex, x) * gaussian(x, vertex, sigma);
}

/** Symmetric priority score for the unordered pair {u, v}. */
export function key(dsu, u, v, sigma) {
  const fieldOfVAtU = fieldValue(dsu, v, u, sigma);
  const fieldOfUAtV = fieldValue(dsu, u, v, sigma);
  return fieldOfVAtU + fieldOfUAtV;
}
