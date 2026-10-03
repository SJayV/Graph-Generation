/** Uniform entry point for running any algorithm in this layer, cycling through them, and reflecting the active one in the UI. */
import { growEdges as growGeneration } from "./algorithms/generation.js";
import { growEdges as growDijkstraUnidirectional } from "./algorithms/dijkstra/dijkstraUnidirectional.js";
import { growEdges as growDijkstraMultidirectional } from "./algorithms/dijkstra/dijkstraMultidirectional.js";
import { growEdges as growAstarUnidirectional } from "./algorithms/astar/astarUnidirectional.js";
import { growEdges as growAstarMultidirectional } from "./algorithms/astar/astarMultidirectional.js";
import { sigmaFromGridSize } from "./logic/computation/field.js";

// CONSTANTS

const GENERATION_SPARSITY = 1.5;

// HELPER FUNCTIONS - GENERATION PARAMETERS

function _inferGridSize(allVertices) {
  return Math.max(...allVertices.flatMap(([x, y]) => [x, y]));
}

// HELPER FUNCTIONS - PER-ALGORITHM RUNNERS

function _runGeneration(allVertices, specialSubset) {
  const sigma = sigmaFromGridSize(_inferGridSize(allVertices));
  const { edges, dsu } = growGeneration(allVertices, specialSubset, GENERATION_SPARSITY, sigma);
  return { edges, dsu, edgeSet: undefined };
}

function _runWithEdgeSet(growEdges, allVertices, specialSubset, edgeSet) {
  const { edges, dsu } = growEdges(allVertices, specialSubset, edgeSet);
  return { edges, dsu, edgeSet };
}

function _runWithHeuristicAndEdgeSet(growEdges, allVertices, specialSubset, edgeSet) {
  const { edges, dsu } = growEdges(allVertices, specialSubset, undefined, edgeSet);
  return { edges, dsu, edgeSet };
}

const ALGORITHMS = {
  generation: {
    displayName: "Generation",
    run: (allVertices, specialSubset) => _runGeneration(allVertices, specialSubset),
  },
  dijkstraUnidirectional: {
    displayName: "Dijkstra - Unidirectional",
    run: (allVertices, specialSubset, edgeSet) =>
      _runWithEdgeSet(growDijkstraUnidirectional, allVertices, specialSubset, edgeSet),
  },
  astarUnidirectional: {
    displayName: "A* - Unidirectional",
    run: (allVertices, specialSubset, edgeSet) =>
      _runWithHeuristicAndEdgeSet(growAstarUnidirectional, allVertices, specialSubset, edgeSet),
  },
  dijkstraMultidirectional: {
    displayName: "Dijkstra - Multidirectional",
    run: (allVertices, specialSubset, edgeSet) =>
      _runWithEdgeSet(growDijkstraMultidirectional, allVertices, specialSubset, edgeSet),
  },
  astarMultidirectional: {
    displayName: "A* - Multidirectional",
    run: (allVertices, specialSubset, edgeSet) =>
      _runWithHeuristicAndEdgeSet(growAstarMultidirectional, allVertices, specialSubset, edgeSet),
  },
};

// PUBLIC INTERFACE

export const ALGORITHM_NAMES = Object.keys(ALGORITHMS);

/** Next name in ALGORITHM_NAMES, wrapping from the last entry back to the first. */
export function nextAlgorithmName(currentName) {
  const currentIndex = ALGORITHM_NAMES.indexOf(currentName);
  const nextIndex = (currentIndex + 1) % ALGORITHM_NAMES.length;
  return ALGORITHM_NAMES[nextIndex];
}

/** Runs the named algorithm with only the parameters it actually needs; optionally reflects its display name in displayTarget. */
export function runAlgorithm(algorithmName, allVertices, specialSubset, edgeSet, displayTarget) {
  const { run, displayName } = ALGORITHMS[algorithmName];
  const result = run(allVertices, specialSubset, edgeSet);
  if (displayTarget !== undefined) {
    displayTarget.textContent = displayName;
  }
  return result;
}
