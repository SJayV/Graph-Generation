/** Root-level orchestrator: creates a graph, runs the active algorithm, and renders the result. */
import { ALGORITHM_NAMES, nextAlgorithmName, runAlgorithm } from "./dispatcher.js";
import { identifyConnectingEdges } from "./algorithms/connectingEdges.js";
import { createGraph, markSpecial, toIndexEdges } from "./graph.js";
import { createPanel } from "./panel.js";
import { EDGE_PACING_MILLISECONDS, SCREEN_MARGIN_FRACTION } from "./parameters.js";
import { createDrawResources, drawRenderState } from "./rendering/gl/drawing/draw.js";
import { createRenderer } from "./rendering/state/renderer.js";

// CONSTANTS

const PANEL_KEY = " ";

// HELPER FUNCTIONS - RENDER-STATE CONVERSION

function _buildRenderData(algorithmName, allVertices, specialSubset, edgeSet, displayTarget) {
  const { edges, dsu, edgeSet: appliedEdgeSet } = runAlgorithm(algorithmName, allVertices, specialSubset, edgeSet, displayTarget);
  const connectingEdges = identifyConnectingEdges(edges, dsu, specialSubset);
  const vertexPairs = [...edges, ...connectingEdges];

  return {
    vertices: markSpecial(allVertices, specialSubset),
    edgeSequence: toIndexEdges(allVertices, vertexPairs),
    edgeSet: toIndexEdges(allVertices, appliedEdgeSet ?? []),
    specialStartIndex: edges.length,
  };
}

// HELPER FUNCTIONS - RENDER LOOP

function _runRenderLoop(gl, drawResources, getRenderer) {
  function frame() {
    drawRenderState(gl, drawResources, getRenderer().getDisplayedState(), SCREEN_MARGIN_FRACTION);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// HELPER FUNCTIONS - KEYBOARD

function _createKeyActions(panel, advanceAlgorithm, regenerate) {
  return {
    [PANEL_KEY]: () => panel.open(),
    Enter: regenerate,
    Tab: () => {advanceAlgorithm(); regenerate();}
  };
}

function _applyPanel(panel, regenerate) {
  if (panel.tryApply()) {
    regenerate();
  }
}

function _handleKeydown(event, keyActions, panel, regenerate) {
  const action = keyActions[event.key];
  if (action === undefined) {
    return;
  }
  event.preventDefault();
  if (!panel.isOpen()) {
    action();
    return;
  }
  if (event.key === PANEL_KEY) {
    _applyPanel(panel, regenerate);
  }
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
    const renderData = _buildRenderData(algorithmName, allVertices, specialSubset, candidateEdgeSet, displayTarget);
    renderer = createRenderer(renderData, EDGE_PACING_MILLISECONDS);
    renderer.start();
  }

  function advanceAlgorithm() {
    algorithmName = nextAlgorithmName(algorithmName);
  }

  const drawResources = createDrawResources(gl);
  regenerate();
  _runRenderLoop(gl, drawResources, () => renderer);

  const panel = createPanel(panelElement);
  const keyActions = _createKeyActions(panel, advanceAlgorithm, regenerate);
  window.addEventListener("keydown", (event) => _handleKeydown(event, keyActions, panel, regenerate));
}
