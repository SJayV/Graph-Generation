/** Shared shortest-path search providing common functionality. */
import { distance } from "../logic/distance.js";
import { edgeKey, vertexKey } from "../logic/vertices.js";
import { incidentPairs } from "./greedyAlgorithm.js";

// HELPER FUNCTIONS - EDGE-SET RESTRICTION

/** Builds a (u, v) => boolean predicate; unrestricted when edgeSet is omitted. */
function _createEdgeFilter(edgeSet) {
  if (edgeSet === undefined) {
    return () => true;
  }
  const allowedEdgeKeys = new Set(edgeSet.map(([u, v]) => edgeKey(u, v)));
  return (u, v) => allowedEdgeKeys.has(edgeKey(u, v));
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

function _resolvedDistance(finalizedDistances, u, v) {
  const uDistance = _finalizedDistance(finalizedDistances, u);
  const vDistance = _finalizedDistance(finalizedDistances, v);
  if (uDistance !== undefined && vDistance !== undefined) {
    return { unresolved: null, value: uDistance + vDistance + distance(u, v) };
  }
  if (uDistance !== undefined) {
    return { unresolved: v, value: uDistance + distance(u, v) };
  }
  if (vDistance !== undefined) {
    return { unresolved: u, value: vDistance + distance(u, v) };
  }
  return { unresolved: null, value: Infinity };
}

// HELPER FUNCTIONS - CANDIDATE SEEDING

function _defaultInitialSources(specialSubset) {
  return specialSubset.length > 0 ? [specialSubset[0]] : [];
}

// PUBLIC INTERFACE

/** Builds the components a Greedy Algorithm needs to run a single-source shortest-path search. */
export function createShortestPathSearch(allVertices, specialSubset, edgeSet, initialSources, extraPriority) {
  const sources = initialSources ?? _defaultInitialSources(specialSubset);
  const finalizedDistances = new Map(sources.map((source) => [vertexKey(source), 0]));
  const isAllowed = _createEdgeFilter(edgeSet);

  function priorityFunction(u, v, dsu) {
    if (!isAllowed(u, v)) {
      return Infinity;
    }
    const { unresolved, value } = _resolvedDistance(finalizedDistances, u, v);
    if (unresolved === null) {
      return value;
    }
    return value + extraPriority(unresolved, dsu);
  }

  function isStale(u, v, dsu, priority) {
    if (priority === Infinity || dsu.connected(u, v)) {
      return true;
    }
    return priorityFunction(u, v, dsu) !== priority;
  }

  function onAccept(u, v) {
    const uFinalized = _isFinalized(finalizedDistances, u);
    const vFinalized = _isFinalized(finalizedDistances, v);
    if (uFinalized && vFinalized) {
      return [];
    }
    const newlyFinalized = uFinalized ? v : u;
    const { value } = _resolvedDistance(finalizedDistances, u, v);
    finalizedDistances.set(vertexKey(newlyFinalized), value);
    return incidentPairs(newlyFinalized, allVertices);
  }

  function terminationFunction(dsu) {
    return _allSpecialsConnected(dsu, specialSubset);
  }

  return { priorityFunction, isStale, onAccept, terminationFunction };
}
