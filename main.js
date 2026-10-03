/** Root-level orchestrator: creates a graph, runs the active algorithm, and renders the result. */
import { ALGORITHM_NAMES, nextAlgorithmName, runAlgorithm } from "./dispatcher.js";
import { identifyConnectingEdges } from "./algorithms/connectingEdges.js";
import { createGraph, markSpecial, toIndexEdges } from "./graph.js";
import { drawRenderState } from "./rendering/gl/draw.js";
import { createRenderer } from "./rendering/state/renderer.js";

// HELPER FUNCTIONS - RENDER-STATE CONVERSION

function _buildRenderData(algorithmName, allVertices, specialSubset, edgeSet, displayTarget) {
  const { edges, dsu, edgeSet: appliedEdgeSet } = runAlgorithm(algorithmName, allVertices, specialSubset, edgeSet, displayTarget);
  const connectingEdges = identifyConnectingEdges(edges, dsu, specialSubset);
  const vertexPairs = [...edges, ...connectingEdges];

  return {
    vertices: markSpecial(allVertices, specialSubset),
    edgeSequence: toIndexEdges(allVertices, vertexPairs),
    edgeSet: appliedEdgeSet === undefined ? undefined : toIndexEdges(allVertices, appliedEdgeSet),
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
    const { allVertices, specialSubset, edgeSet: candidateEdgeSet } = createGraph();
    const { vertices, edgeSequence, edgeSet, specialStartIndex } = _buildRenderData(algorithmName, allVertices, specialSubset, candidateEdgeSet, displayTarget);
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
