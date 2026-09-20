/** Gaussian-field priority score used by the greedy edge-growth algorithm. */
import { gaussian } from "./rng.js";

// CONSTANTS

const DAMPENING_FACTOR = 0.1;
const STRENGTHENING_FACTOR = 10.0;
export const SIGMA_DIVISOR = 15.0;

// HELPER FUNCTIONS - STRENGTH CALCULATION

function _strength(dsu, vertex, x) {
  const dampeningFactor = dsu.connected(vertex, x) ? DAMPENING_FACTOR : 1;
  return Math.sqrt(dampeningFactor * (dsu.componentSize(vertex)));
}

// PUBLIC INTERFACE

/** Derives the Gaussian spread sigma from the grid size. */
export function sigmaFromGridSize(gridSize) {
  return gridSize / SIGMA_DIVISOR;
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
