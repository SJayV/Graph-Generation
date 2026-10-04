/** Pure render-state helper; single source of truth for what is rendered at a given step. */
import { computeGlow } from "./glow.js";

// HELPER FUNCTIONS

function _buildVertices(vertices) {
  return vertices.map((position) => ({ position, category: position[2] ? "special" : "normal" }));
}

function _buildBackgroundEdges(edgeSet) {
  return edgeSet.map(([startIndex, endIndex]) => ({ startIndex, endIndex, category: "background" }));
}

function _buildNormalEdges(edgeSequence, stepIndex, currentTime, edgePacingMilliseconds, specialStartIndex) {
  return edgeSequence.slice(0, stepIndex).map(([startIndex, endIndex], edgeIndex) => {
    const category = edgeIndex >= specialStartIndex ? "special" : "normal";
    const becameVisibleAt = edgeIndex * edgePacingMilliseconds;
    const glow = computeGlow(currentTime - becameVisibleAt, edgePacingMilliseconds);
    return { startIndex, endIndex, category, glow };
  });
}

// PUBLIC INTERFACE

export function computeRenderState(renderData, stepIndex, currentTime, edgePacingMilliseconds) {
  const { vertices, edgeSequence, edgeSet, specialStartIndex } = renderData;
  return {
    vertices: _buildVertices(vertices),
    edges: [
      ..._buildBackgroundEdges(edgeSet),
      ..._buildNormalEdges(edgeSequence, stepIndex, currentTime, edgePacingMilliseconds, specialStartIndex),
    ],
  };
}
