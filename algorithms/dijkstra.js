/** Single-source Dijkstra, starting from one special vertex at a time, optionally restricted to an edgeSet. */
import { distance } from "../logic/distance.js";
import { edgeKey } from "../logic/edges.js";
import { vertexKey } from "../logic/vertices.js";
import { growEdgesStepwise as _growEdgesStepwise } from "./greedyAlgorithm.js";

// HELPER FUNCTIONS - EDGE-SET RESTRICTION

function _buildAllowedEdgeKeys(edgeSet) {
  if (edgeSet === undefined) {
    return null;
  }
  return new Set(edgeSet.map(([u, v]) => edgeKey(u, v)));
}

function _isAllowed(allowedEdgeKeys, u, v) {
  if (allowedEdgeKeys === null) {
    return true;
  }
  return allowedEdgeKeys.has(edgeKey(u, v));
}

// HELPER FUNCTIONS - TERMINATION

function _allSpecialsConnected(dsu, specialSubset) {
  if (specialSubset.length < 2) {
    return true;
  }
  const [first, ...rest] = specialSubset;
  return rest.every((special) => dsu.connected(first, special));
}

// HELPER FUNCTIONS - LIVE FINALIZED-DISTANCE TRACKING

function _finalizedDistance(finalizedDistances, vertex) {
  return finalizedDistances.get(vertexKey(vertex));
}

function _isFinalized(finalizedDistances, vertex) {
  return finalizedDistances.has(vertexKey(vertex));
}

// HELPER FUNCTIONS - CANDIDATE SEEDING

function _outwardCandidatesFrom(vertex, allVertices) {
  return allVertices.filter((other) => other !== vertex).map((other) => [vertex, other]);
}

// PUBLIC INTERFACE

/** Yield accepted edges one at a time, in the order Dijkstra finalizes them. */
export function* growEdgesStepwise(allVertices, specialSubset, edgeSet) {
  const finalizedDistances = new Map(
    specialSubset.length > 0 ? [[vertexKey(specialSubset[0]), 0]] : [],
  );
  const allowedEdgeKeys = _buildAllowedEdgeKeys(edgeSet);

  function priorityFunction(u, v) {
    if (!_isAllowed(allowedEdgeKeys, u, v)) {
      return Infinity;
    }
    const uDistance = _finalizedDistance(finalizedDistances, u);
    const vDistance = _finalizedDistance(finalizedDistances, v);
    if (uDistance !== undefined && vDistance !== undefined) {
      return uDistance + vDistance + distance(u, v);
    }
    if (uDistance !== undefined) {
      return uDistance + distance(u, v);
    }
    if (vDistance !== undefined) {
      return vDistance + distance(u, v);
    }
    return Infinity;
  }

  function isStale(u, v, dsu, priority) {
    if (priority === Infinity) {
      return true;
    }
    if (dsu.connected(u, v)) {
      return true;
    }
    return priorityFunction(u, v) !== priority;
  }

  function onAccept(u, v, priority) {
    const uFinalized = _isFinalized(finalizedDistances, u);
    const vFinalized = _isFinalized(finalizedDistances, v);
    if (uFinalized && vFinalized) {
      return [];
    }
    const newlyFinalized = uFinalized ? v : u;
    finalizedDistances.set(vertexKey(newlyFinalized), priority);
    return _outwardCandidatesFrom(newlyFinalized, allVertices);
  }

  function terminationFunction(dsu) {
    return _allSpecialsConnected(dsu, specialSubset);
  }

  return yield* _growEdgesStepwise(allVertices, specialSubset, priorityFunction, terminationFunction, onAccept, isStale);
}

/** Grow edges via Dijkstra until every special vertex shares one DSU root. */
export function growEdges(allVertices, specialSubset, edgeSet) {
  const generator = growEdgesStepwise(allVertices, specialSubset, edgeSet);
  const edges = [];
  let step = generator.next();
  while (!step.done) {
    edges.push(step.value);
    step = generator.next();
  }
  return { edges, dsu: step.value };
}
