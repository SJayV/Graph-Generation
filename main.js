/** Root-level orchestrator: creates a graph, runs the active algorithm, and renders the result. */
import { ALGORITHM_NAMES, nextAlgorithmName, runAlgorithm } from "./dispatcher.js";
import { identifyConnectingEdges } from "./algorithms/connectingEdges.js";
import { createGraph } from "./graph.js";
import { buildNearestNeighborEdges } from "./logic/randomness/edges.js";
import { vertexKey } from "./logic/randomness/vertices.js";
import { drawRenderState } from "./rendering/gl/draw.js";
import { createRenderer } from "./rendering/state/renderer.js";

// HELPER FUNCTIONS - RENDER-STATE CONVERSION

function _markSpecial(allVertices, specialSubset) {
  const specialKeys = new Set(specialSubset.map(vertexKey));
  return allVertices.map(([x, y]) => [x, y, specialKeys.has(vertexKey([x, y]))]);
}

function _toIndexEdges(allVertices, vertexPairs) {
  const indexByKey = new Map(allVertices.map((vertex, index) => [vertexKey(vertex), index]));
  return vertexPairs.map(([u, v]) => [indexByKey.get(vertexKey(u)), indexByKey.get(vertexKey(v))]);
}

function _buildRenderData(algorithmName, allVertices, specialSubset, displayTarget) {
  const edgeSet = buildNearestNeighborEdges(allVertices);
  const { edges, dsu, edgeSet: appliedEdgeSet } = runAlgorithm(algorithmName, allVertices, specialSubset, edgeSet, displayTarget);
  const connectingEdges = identifyConnectingEdges(edges, dsu, specialSubset);
  const vertexPairs = [...edges, ...connectingEdges];

  return {
    vertices: _markSpecial(allVertices, specialSubset),
    edgeSequence: _toIndexEdges(allVertices, vertexPairs),
    edgeSet: appliedEdgeSet === undefined ? undefined : _toIndexEdges(allVertices, appliedEdgeSet),
    specialStartIndex: edges.length,
  };
}

// HELPER FUNCTIONS - RENDER LOOP

function _runRenderLoop(gl, getRenderer) {
  function frame() {
    drawRenderState(gl, getRenderer().getDisplayedState());
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// PUBLIC INTERFACE

export function startDemo(canvasElement, displayTarget) {
  const gl = canvasElement.getContext("webgl");
  if (!gl) {
    throw new Error("WebGL is not supported in this browser.");
  }

  let algorithmName = ALGORITHM_NAMES[0];
  let renderer = null;

  function regenerate() {
    if (renderer !== null) {
      renderer.stop();
    }
    const { allVertices, specialSubset } = createGraph();
    const { vertices, edgeSequence, edgeSet, specialStartIndex } = _buildRenderData(
      algorithmName,
      allVertices,
      specialSubset,
      displayTarget,
    );
    renderer = createRenderer(vertices, edgeSequence, edgeSet, specialStartIndex);
    renderer.start();
  }

  regenerate();
  _runRenderLoop(gl, () => renderer);

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") {
      return;
    }
    event.preventDefault();
    algorithmName = nextAlgorithmName(algorithmName);
    regenerate();
  });
}
