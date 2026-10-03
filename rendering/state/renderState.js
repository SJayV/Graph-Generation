/** Pure render-state helper; single source of truth for what is rendered at a given step. */

// HELPER FUNCTIONS

function _buildVertices(vertices) {
  return vertices.map((position) => ({ position, category: position[2] ? "special" : "normal" }));
}

function _buildBackgroundEdges(edgeSet) {
  return (edgeSet ?? []).map(([startIndex, endIndex]) => ({ startIndex, endIndex, category: "background" }));
}

function _buildNormalEdges(edgeSequence, stepIndex, currentTime, computeGlow, edgePacingMilliseconds, specialStartIndex) {
  return edgeSequence.slice(0, stepIndex).map(([startIndex, endIndex], edgeIndex) => {
    const category = edgeIndex >= specialStartIndex ? "special" : "normal";
    const edge = { startIndex, endIndex, category };
    if (currentTime === undefined) {
      return edge;
    }
    const becameVisibleAt = edgeIndex * edgePacingMilliseconds;
    const glow = computeGlow(currentTime - becameVisibleAt, edgePacingMilliseconds);
    return { ...edge, becameVisibleAt, glow };
  });
}

// PUBLIC INTERFACE

export function computeRenderState(vertices, edgeSequence, stepIndex, currentTime, computeGlow, edgePacingMilliseconds, edgeSet, specialStartIndex = Infinity) {
  return {
    vertices: _buildVertices(vertices),
    edges: [
      ..._buildBackgroundEdges(edgeSet),
      ..._buildNormalEdges(edgeSequence, stepIndex, currentTime, computeGlow, edgePacingMilliseconds, specialStartIndex),
    ],
  };
}
