/** Uniform entry point for running any algorithm in this layer, cycling through them, and reflecting the active one in the UI. */
import { growEdgesStepwise as growGenerationStepwise } from "./algorithms/parametrization/generation.js";
import { growEdgesUnidirectionalStepwise as growDijkstraUnidirectionalStepwise, growEdgesMultidirectionalStepwise as growDijkstraMultidirectionalStepwise } from "./algorithms/parametrization/dijkstra.js";
import { growEdgesUnidirectionalStepwise as growAstarUnidirectionalStepwise, growEdgesMultidirectionalStepwise as growAstarMultidirectionalStepwise } from "./algorithms/parametrization/astar.js";
import { drainEdges } from "./algorithms/skeleton/greedyAlgorithm.js";
import { GRID_SIZE, SPARSITY } from "./parameters.js";

// HELPER FUNCTIONS - GENERATION PARAMETERS

function _sigmaForVertexCount(vertexCount) {
  return GRID_SIZE / Math.sqrt(vertexCount);
}

// HELPER FUNCTIONS - PER-ALGORITHM RUNNERS

function _runGeneration(allVertices, specialSubset) {
  const sigma = _sigmaForVertexCount(allVertices.length);
  const { edges, dsu } = drainEdges(growGenerationStepwise(allVertices, specialSubset, SPARSITY, sigma));
  return { edges, dsu, edgeSet: undefined };
}

function _runShortestPath(growEdgesStepwise, allVertices, specialSubset, edgeSet) {
  const { edges, dsu } = drainEdges(growEdgesStepwise(allVertices, specialSubset, undefined, edgeSet));
  return { edges, dsu, edgeSet };
}

const ALGORITHMS = {
  generation: {
    displayName: "Generation",
    run: (allVertices, specialSubset) => _runGeneration(allVertices, specialSubset)
  },
  dijkstraUnidirectional: {
    displayName: "Dijkstra - Unidirectional",
    run: (allVertices, specialSubset, edgeSet) => _runShortestPath(growDijkstraUnidirectionalStepwise, allVertices, specialSubset, edgeSet)
  },
  astarUnidirectional: {
    displayName: "A* - Unidirectional",
    run: (allVertices, specialSubset, edgeSet) => _runShortestPath(growAstarUnidirectionalStepwise, allVertices, specialSubset, edgeSet)
  },
  dijkstraMultidirectional: {
    displayName: "Dijkstra - Multidirectional",
    run: (allVertices, specialSubset, edgeSet) => _runShortestPath(growDijkstraMultidirectionalStepwise, allVertices, specialSubset, edgeSet)
  },
  astarMultidirectional: {
    displayName: "A* - Multidirectional",
    run: (allVertices, specialSubset, edgeSet) => _runShortestPath(growAstarMultidirectionalStepwise, allVertices, specialSubset, edgeSet)
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
