/** Root-level orchestrator: generates a graph in-memory and renders it. */
import { growEdgesStepwise } from "./algorithms/generation.js";
import { sigmaFromGridSize } from "./logic/field.js";
import { createSeededRng } from "./logic/rng.js";
import { sampleVertices, selectSpecialSubset, vertexKey } from "./logic/vertices.js";
import { drawRenderState } from "./rendering/draw.js";
import { createRenderer } from "./rendering/renderer.js";

const VERTEX_COUNT = 400;
const GRID_SIZE = 1000;
const SPECIAL_SUBSET_SIZE = 6;
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
  const sigma = sigmaFromGridSize(GRID_SIZE);

  const vertexPairs = [...growEdgesStepwise(allVertices, specialSubset, SPARSITY, sigma)];

  return {
    vertices: _markSpecial(allVertices, specialSubset),
    edgeSequence: _toIndexEdges(allVertices, vertexPairs),
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

  const { vertices, edgeSequence } = _generateGraph();
  const renderer = createRenderer(vertices, edgeSequence);
  renderer.start();

  _runRenderLoop(gl, renderer);
}
