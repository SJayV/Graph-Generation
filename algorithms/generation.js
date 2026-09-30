/** Greedy, field-priority-driven edge growth over a fixed vertex set. */
import * as fieldModule from "../logic/field.js";
import { growEdgesStepwise as _growEdgesStepwise } from "./greedyAlgorithm.js";

// HELPER FUNCTIONS - EDGE GROWTH

function _targetEdgeCount(vertexCount, r) {
  const maxEdges = (vertexCount * (vertexCount - 1)) / 2;
  return Math.min(Math.floor(r * vertexCount), maxEdges);
}

function _reactivationPairsFor(vertex, allVertices) {
  return allVertices.filter((other) => other !== vertex).map((other) => [vertex, other]);
}

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in acceptance order. */
export function* growEdgesStepwise(allVertices, specialSubset, r, sigma) {
  const targetEdgeCount = _targetEdgeCount(allVertices.length, r);
  let acceptedCount = 0;

  function priorityFunction(u, v, dsu) {
    return -fieldModule.key(dsu, u, v, sigma);
  }

  function terminationFunction() {
    return acceptedCount >= targetEdgeCount;
  }

  function onAccept(u, v) {
    acceptedCount += 1;
    return [..._reactivationPairsFor(u, allVertices), ..._reactivationPairsFor(v, allVertices)];
  }

  return yield* _growEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept);
}

/** Grow edges greedily by field priority until the target count is reached. */
export function growEdges(allVertices, specialSubset, r, sigma) {
  const generator = growEdgesStepwise(allVertices, specialSubset, r, sigma);
  const edges = [];
  let step = generator.next();
  while (!step.done) {
    edges.push(step.value);
    step = generator.next();
  }
  return { edges, dsu: step.value };
}
