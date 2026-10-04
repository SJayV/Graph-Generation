export const VERTEX_COUNT = 400;
export const GRID_SIZE = 1000;
export const SPECIAL_SUBSET_SIZE = 5;
export const NEAREST_NEIGHBOR_COUNT = 4;
export const SPARSITY = 1.5;
export const DAMPENING_FACTOR = 0.1;
export const STRENGTHENING_FACTOR = 10.0;
export const EDGE_PACING_MILLISECONDS = 30;
export const SCREEN_MARGIN_FRACTION = 0.15;

// PUBLIC INTERFACE

export function sigma(vertexCount = VERTEX_COUNT, gridSize = GRID_SIZE) {
  return gridSize / Math.sqrt(vertexCount);
}
