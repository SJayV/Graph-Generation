/** Root-level orchestrator: generates a graph in-memory and renders it. */
import { growEdges } from "./algorithms/astar/astarMultidirectional.js";
import { identifyConnectingEdges } from "./algorithms/connectingEdges.js";
import { buildNearestNeighborEdges } from "./logic/randomness/edges.js";
import { createSeededRng } from "./logic/randomness/rng.js";
import { sampleVertices, selectSpecialSubset, vertexKey } from "./logic/randomness/vertices.js";
import { drawRenderState } from "./rendering/gl/draw.js";
import { createRenderer } from "./rendering/state/renderer.js";

const VERTEX_COUNT = 400;
const GRID_SIZE = 1000;
const SPECIAL_SUBSET_SIZE = 5;
const SPARSITY = 1.5;

// HELPER FUNCTIONS - GRAPH GENERATION

function _createEntropySeed() {
  return Math.floor(Math.random() * 0xffffffff);
}

function _markSpecial(allVertices, specialSubset) {
  const specialKeys = new Set(specialSubset.map(vertexKey));
  return allVertices.map(([x, y]) => [x, y, specialKeys.has(vertexKey([x, y]))]);
}

function _toIndexEdges(allVertices, vertexPairs) {
  const indexByKey = new Map(allVertices.map((vertex, index) => [vertexKey(vertex), index]));
  return vertexPairs.map(([u, v]) => [indexByKey.get(vertexKey(u)), indexByKey.get(vertexKey(v))]);
}

function _generateGraph() {
  const rng = createSeededRng(_createEntropySeed());
  const allVertices = sampleVertices(VERTEX_COUNT, GRID_SIZE, rng);
  const specialSubset = selectSpecialSubset(allVertices, SPECIAL_SUBSET_SIZE, rng);
  const edgeSet = buildNearestNeighborEdges(allVertices);

  const { edges, dsu } = growEdges(allVertices, specialSubset, undefined, edgeSet);
  const connectingEdges = identifyConnectingEdges(edges, dsu, specialSubset);
  const vertexPairs = [...edges, ...connectingEdges];

  return {
    vertices: _markSpecial(allVertices, specialSubset),
    edgeSequence: _toIndexEdges(allVertices, vertexPairs),
    edgeSet: _toIndexEdges(allVertices, edgeSet),
    specialStartIndex: edges.length,
  };
}

// HELPER FUNCTIONS - RENDER LOOP

function _runRenderLoop(gl, renderer) {
  function frame() {
    drawRenderState(gl, renderer.getDisplayedState());
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// PUBLIC INTERFACE

export function startDemo(canvasElement) {
  const gl = canvasElement.getContext("webgl");
  if (!gl) {
    throw new Error("WebGL is not supported in this browser.");
  }

  const { vertices, edgeSequence, edgeSet, specialStartIndex } = _generateGraph();
  const renderer = createRenderer(vertices, edgeSequence, edgeSet, specialStartIndex);
  renderer.start();

  _runRenderLoop(gl, renderer);
}
