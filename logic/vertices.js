/** Vertex sampling, canonical keying, and special-subset selection on a discrete grid. */
import { gaussian, sampleWithoutReplacement, weightedSampleWithoutReplacement } from "./rng.js";

// CONSTANTS

const GAUSSIAN_SIGMA_DIVISOR = 3.0;

// HELPER FUNCTIONS

function _buildGridPoints(gridSideLength) {
  const gridPoints = [];
  for (let x = 0; x < gridSideLength; x += 1) {
    for (let y = 0; y < gridSideLength; y += 1) {
      gridPoints.push([x, y]);
    }
  }
  return gridPoints;
}

// PUBLIC INTERFACE

export function vertexKey(vertex) {
  return `${vertex[0]},${vertex[1]}`;
}

/**
 * Samples n pairwise-distinct integer coordinates from {0,...,L}^2, biased
 * toward the grid center by a Gaussian weight (roughly normally distributed).
 * Throws when n exceeds the grid's capacity, (L + 1) ** 2.
 */
export function sampleVertices(n, L, rngSource) {
  const gridSideLength = L + 1;
  const gridCapacity = gridSideLength * gridSideLength;
  if (n > gridCapacity) {
    throw new Error(`cannot sample ${n} unique vertices from a grid of capacity ${gridCapacity}`);
  }

  const allGridPoints = _buildGridPoints(gridSideLength);
  const center = [L / 2, L / 2];
  const sigma = gridSideLength / GAUSSIAN_SIGMA_DIVISOR;
  return weightedSampleWithoutReplacement(rngSource, allGridPoints, n, (point) => gaussian(point, center, sigma));
}

/**
 * Selects k distinct members of allVertices to form the special subset.
 * Throws when k is negative or larger than allVertices.length.
 */
export function selectSpecialSubset(allVertices, k, rngSource) {
  if (k < 0 || k > allVertices.length) {
    throw new Error(`k=${k} must satisfy 0 <= k <= ${allVertices.length}`);
  }

  return sampleWithoutReplacement(rngSource, allVertices, k);
}
