/** Gaussian-field priority score used by the greedy edge-growth algorithm. */
import { gaussian } from "../construction/rng.js";

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

export function sigma(vertexCount, gridSize) {
  return gridSize / Math.sqrt(vertexCount);
}

/** Symmetric priority score for the unordered pair {u, v}. */
export function key(dsu, u, v, fieldShape) {
  const fieldOfVAtU = _fieldValue(dsu, v, u, fieldShape);
  const fieldOfUAtV = _fieldValue(dsu, u, v, fieldShape);
  return fieldOfVAtU + fieldOfUAtV;
}
