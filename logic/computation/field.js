/** Gaussian-field priority score used by the greedy edge-growth algorithm. */
import { gaussian } from "../randomness/rng.js";
import { DAMPENING_FACTOR, STRENGTHENING_FACTOR } from "../../parameters.js";

// HELPER FUNCTIONS - STRENGTH CALCULATION

function _strength(dsu, vertex, x) {
  const dampeningFactor = dsu.connected(vertex, x) ? DAMPENING_FACTOR : 1;
  return Math.sqrt(dampeningFactor * (dsu.componentSize(vertex)));
}

// PUBLIC INTERFACE

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
