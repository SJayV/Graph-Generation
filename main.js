/** Root-level orchestrator: creates a graph, runs the active algorithm, and renders the result. */
import { ALGORITHM_NAMES, nextAlgorithmName, runAlgorithm } from "./dispatcher.js";
import { identifyConnectingEdges } from "./algorithms/connectingEdges.js";
import { createGraph, markSpecial, toIndexEdges } from "./graph.js";
import { createPanel } from "./panel.js";
import { drawRenderState } from "./rendering/gl/draw.js";
import { createRenderer } from "./rendering/state/renderer.js";

// CONSTANTS

const CONTROL_KEYS = ["Tab", "Enter", " "];

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

// HELPER FUNCTIONS - KEYBOARD

function _handleOpenPanelKey(key, panel, regenerate) {
  if (key === " " && panel.tryApply()) {
    regenerate();
  }
}

function _handleClosedPanelKey(key, panel, advanceAlgorithm, regenerate) {
  if (key === " ") {
    panel.open();
    return;
  }
  if (key === "Tab") {
    advanceAlgorithm();
  }
  if (key === "Tab" || key === "Enter") {
    regenerate();
  }
}

function _handleKeydown(event, panel, advanceAlgorithm, regenerate) {
  if (CONTROL_KEYS.includes(event.key)) {
    event.preventDefault();
  }
  if (panel.isOpen()) {
    _handleOpenPanelKey(event.key, panel, regenerate);
    return;
  }
  _handleClosedPanelKey(event.key, panel, advanceAlgorithm, regenerate);
}

// PUBLIC INTERFACE

export function startDemo(canvasElement, displayTarget, panelElement) {
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

  function advanceAlgorithm() {
    algorithmName = nextAlgorithmName(algorithmName);
  }

  regenerate();
  _runRenderLoop(gl, () => renderer);

  const panel = createPanel(panelElement);
  window.addEventListener("keydown", (event) => _handleKeydown(event, panel, advanceAlgorithm, regenerate));
}
