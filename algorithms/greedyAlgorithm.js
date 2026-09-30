/**
 * Shared greedy candidate-heap-driven accept/union/reactivate skeleton.
 * Configured per algorithm by:
 *    - ascending priority function
 *    - termination predicate
 *    - shared loop structure
 */
import { DSU } from "../logic/dsu.js";
import { MinHeap } from "../logic/minHeap.js";
import { edgeKey } from "../logic/vertices.js";

// HELPER FUNCTIONS - CANDIDATE POOL

function _candidatePairs(allVertices) {
  const pairs = [];
  for (let i = 0; i < allVertices.length; i += 1) {
    for (let j = i + 1; j < allVertices.length; j += 1) {
      pairs.push([allVertices[i], allVertices[j]]);
    }
  }
  return pairs;
}

function _pushCandidate(heap, u, v, priorityFunction, dsu) {
  const priority = priorityFunction(u, v, dsu);
  heap.push({ priority, u, v });
}

function _initializeHeap(allVertices, priorityFunction, dsu) {
  const heap = new MinHeap((a, b) => a.priority < b.priority);
  for (const [u, v] of _candidatePairs(allVertices)) {
    _pushCandidate(heap, u, v, priorityFunction, dsu);
  }
  return heap;
}

function _noReactivation() {
  return [];
}

function _neverStale() {
  return false;
}

// PUBLIC INTERFACE

/** Yields accepted [u, v] edges one at a time, in acceptance order. */
export function* growEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept = _noReactivation, isStale = _neverStale) {
  const dsu = new DSU(allVertices, specialSubset);
  const heap = _initializeHeap(allVertices, priorityFunction, dsu);
  const acceptedPairs = new Set();

  while (!terminationFunction(dsu) && heap.size > 0) {
    const { u, v, priority } = heap.pop();

    if (isStale(u, v, dsu, priority)) {
      continue;
    }

    const pairKey = edgeKey(u, v);
    if (acceptedPairs.has(pairKey)) {
      continue;
    }

    dsu.union(u, v);
    acceptedPairs.add(pairKey);
    yield [u, v];

    const reactivations = onAccept(u, v, priority, dsu);
    for (const [x, y] of reactivations) {
      _pushCandidate(heap, x, y, priorityFunction, dsu);
    }
  }

  return dsu;
}

export { _candidatePairs };
