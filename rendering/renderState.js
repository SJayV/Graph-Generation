/** Pure render-state helper; single source of truth for what is rendered at a given step. */

// HELPER FUNCTIONS

function _buildDots(vertices) {
  return vertices.map((position) => ({ position }));
}

function _buildVisibleEdges(edgeSequence, stepIndex, currentTime, computeGlow, edgePacingMilliseconds, highlightStartIndex) {
  return edgeSequence.slice(0, stepIndex).map(([startIndex, endIndex], edgeIndex) => {
    const category = edgeIndex >= highlightStartIndex ? "highlight" : "growth";
    const edge = { startIndex, endIndex, category };
    if (currentTime === undefined) {
      return edge;
    }
    const becameVisibleAt = edgeIndex * edgePacingMilliseconds;
    const glow = computeGlow(currentTime - becameVisibleAt, edgePacingMilliseconds);
    return { ...edge, becameVisibleAt, glow };
  });
}

function _buildBaselineEdges(edgeSet) {
  return (edgeSet ?? []).map(([startIndex, endIndex]) => ({ startIndex, endIndex }));
}

// PUBLIC INTERFACE

export function computeRenderState(vertices, edgeSequence, stepIndex, currentTime, computeGlow, edgePacingMilliseconds, edgeSet, highlightStartIndex = Infinity) {
  return {
    dots: _buildDots(vertices),
    visibleEdges: _buildVisibleEdges(edgeSequence, stepIndex, currentTime, computeGlow, edgePacingMilliseconds, highlightStartIndex),
    baselineEdges: _buildBaselineEdges(edgeSet),
  };
}
