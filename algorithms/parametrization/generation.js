/** Greedy, field-priority-driven edge growth over a fixed vertex set. */
import { key as fieldKey } from "../../logic/computation/field.js";
import { growEdgesStepwise as _growEdgesStepwise, incidentPairs } from "../skeleton/greedyAlgorithm.js";

// HELPER FUNCTIONS - EDGE GROWTH

function _targetEdgeCount(vertexCount, r) {
  const maxEdges = (vertexCount * (vertexCount - 1)) / 2;
  return Math.min(Math.floor(r * vertexCount), maxEdges);
}

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in acceptance order. */
export function* growEdgesStepwise(allVertices, specialSubset, r, fieldShape) {
  const targetEdgeCount = _targetEdgeCount(allVertices.length, r);
  let acceptedCount = 0;

  function priorityFunction(u, v, dsu) {
    return -fieldKey(dsu, u, v, fieldShape);
  }

  function terminationFunction() {
    return acceptedCount >= targetEdgeCount;
  }

  function onAccept(u, v) {
    acceptedCount += 1;
    return [...incidentPairs(u, allVertices), ...incidentPairs(v, allVertices)];
  }

  return yield* _growEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept);
}
