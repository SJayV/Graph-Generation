/** Greedy, field-priority-driven edge growth over a fixed vertex set. */
import { DSU } from "../logic/dsu.js";
import * as fieldModule from "../logic/field.js";
import { MinHeap } from "../logic/minHeap.js";
import { vertexKey } from "../logic/vertices.js";

// HELPER FUNCTIONS - VERTEX KEYING

function _pairKey(u, v) {
  const [a, b] = [vertexKey(u), vertexKey(v)].sort();
  return `${a}|${b}`;
}

// HELPER FUNCTIONS - PRIORITY ORDERING

function _isHigherPriorityEntry(a, b) {
  if (a.priority !== b.priority) {
    return a.priority < b.priority;
  }
  const aKey = `${vertexKey(a.u)},${vertexKey(a.v)}`;
  const bKey = `${vertexKey(b.u)},${vertexKey(b.v)}`;
  return aKey < bKey;
}

// HELPER FUNCTIONS - EDGE GROWTH

function _targetEdgeCount(vertexCount, r) {
  const maxEdges = (vertexCount * (vertexCount - 1)) / 2;
  return Math.min(Math.floor(r * vertexCount), maxEdges);
}

function _candidatePairs(allVertices) {
  const pairs = [];
  for (let i = 0; i < allVertices.length; i += 1) {
    for (let j = i + 1; j < allVertices.length; j += 1) {
      pairs.push([allVertices[i], allVertices[j]]);
    }
  }
  return pairs;
}

function _buildInitialHeap(allVertices, structure, sigma) {
  const heap = new MinHeap(_isHigherPriorityEntry);
  for (const [u, v] of _candidatePairs(allVertices)) {
    const priority = fieldModule.key(structure, u, v, sigma);
    heap.push({ priority: -priority, u, v });
  }
  return heap;
}

function _reactivateCandidatesFor(heap, vertex, allVertices, structure, sigma) {
  for (const other of allVertices) {
    if (vertexKey(other) === vertexKey(vertex)) {
      continue;
    }
    const priority = fieldModule.key(structure, vertex, other, sigma);
    heap.push({ priority: -priority, u: vertex, v: other });
  }
}

function* _acceptedEdges(allVertices, structure, r, sigma) {
  const targetEdgeCount = _targetEdgeCount(allVertices.length, r);
  const heap = _buildInitialHeap(allVertices, structure, sigma);
  const acceptedPairs = new Set();

  let acceptedCount = 0;
  while (acceptedCount < targetEdgeCount && heap.size > 0) {
    const { u, v } = heap.pop();
    const pairKey = _pairKey(u, v);
    if (acceptedPairs.has(pairKey)) {
      continue;
    }

    structure.union(u, v);
    acceptedPairs.add(pairKey);
    acceptedCount += 1;
    _reactivateCandidatesFor(heap, u, allVertices, structure, sigma);
    _reactivateCandidatesFor(heap, v, allVertices, structure, sigma);
    yield [u, v];
  }
}

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in acceptance order. */
export function* growEdgesStepwise(allVertices, specialSubset, r, sigma) {
  const structure = new DSU(allVertices, specialSubset);
  yield* _acceptedEdges(allVertices, structure, r, sigma);
}

/** Grow edges greedily by field priority until the target count is reached. */
export function growEdges(allVertices, specialSubset, r, sigma) {
  const structure = new DSU(allVertices, specialSubset);
  const edges = [..._acceptedEdges(allVertices, structure, r, sigma)];
  return { edges, dsu: structure };
}

export { _candidatePairs };
