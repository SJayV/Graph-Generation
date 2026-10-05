export let VERTEX_COUNT;
export let GRID_SIZE;
export let SPECIAL_SUBSET_SIZE;
export let NEAREST_NEIGHBOR_COUNT;
export let SPARSITY;
export let DAMPENING_FACTOR;
export let STRENGTHENING_FACTOR;
export let EDGE_PACING_MILLISECONDS;
export let SCREEN_MARGIN_FRACTION;

// PUBLIC INTERFACE

export function setParameters({vertexCount = 400, gridSize = 1000, specialSubsetSize = 5, nearestNeighborCount = 4, sparsity = 1.5, dampeningFactor = 0.1, strengtheningFactor = 10.0, edgePacingMilliseconds = 80, screenMarginFraction = 0.15} = {}) {
  VERTEX_COUNT = vertexCount;
  GRID_SIZE = gridSize;
  SPECIAL_SUBSET_SIZE = specialSubsetSize;
  NEAREST_NEIGHBOR_COUNT = nearestNeighborCount;
  SPARSITY = sparsity;
  DAMPENING_FACTOR = dampeningFactor;
  STRENGTHENING_FACTOR = strengtheningFactor;
  EDGE_PACING_MILLISECONDS = edgePacingMilliseconds;
  SCREEN_MARGIN_FRACTION = screenMarginFraction;
}

export function getParameters() {
  return {
    vertexCount: VERTEX_COUNT,
    gridSize: GRID_SIZE,
    specialSubsetSize: SPECIAL_SUBSET_SIZE,
    nearestNeighborCount: NEAREST_NEIGHBOR_COUNT,
    sparsity: SPARSITY,
    dampeningFactor: DAMPENING_FACTOR,
    strengtheningFactor: STRENGTHENING_FACTOR,
    edgePacingMilliseconds: EDGE_PACING_MILLISECONDS,
    screenMarginFraction: SCREEN_MARGIN_FRACTION,
  };
}

setParameters();
