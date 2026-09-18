/**
 * Pure render-state helper.
 *
 * `computeRenderState` is the single source of truth for what is rendered
 * at a given step.
 */

function _buildDots(vertices) {
  return vertices.map((position) => ({ position }));
}

function _buildVisibleEdges(edgeSequence, stepIndex) {
  return edgeSequence
    .slice(0, stepIndex)
    .map(([startIndex, endIndex]) => ({ startIndex, endIndex }));
}

export function computeRenderState(vertices, edgeSequence, stepIndex) {
  return {
    dots: _buildDots(vertices),
    visibleEdges: _buildVisibleEdges(edgeSequence, stepIndex),
  };
}
