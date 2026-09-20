/**
 * Pure render-state helper. `computeRenderState` is the single source of
 * truth for what is rendered at a given step.
 */

// HELPER FUNCTIONS

function _buildDots(vertices) {
  return vertices.map((position) => ({ position }));
}

function _buildVisibleEdges(edgeSequence, stepIndex, currentTime, computeGlow, edgePacingMilliseconds) {
  return edgeSequence.slice(0, stepIndex).map(([startIndex, endIndex], edgeIndex) => {
    const edge = { startIndex, endIndex };
    if (currentTime === undefined) {
      return edge;
    }
    const becameVisibleAt = edgeIndex * edgePacingMilliseconds;
    const glow = computeGlow(currentTime - becameVisibleAt, edgePacingMilliseconds);
    return { ...edge, becameVisibleAt, glow };
  });
}

// PUBLIC INTERFACE

export function computeRenderState(vertices, edgeSequence, stepIndex, currentTime, computeGlow, edgePacingMilliseconds) {
  return {
    dots: _buildDots(vertices),
    visibleEdges: _buildVisibleEdges(edgeSequence, stepIndex, currentTime, computeGlow, edgePacingMilliseconds),
  };
}
