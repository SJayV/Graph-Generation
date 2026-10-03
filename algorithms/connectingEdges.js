/** Identifies which accepted edges lie on a path connecting two special vertices. */
import { edgeKey, vertexKey } from "../logic/randomness/vertices.js";

// HELPER FUNCTIONS - ADJACENCY

function _buildAdjacency(edges) {
  const adjacency = new Map();
  const neighborsOf = (vertex) => {
    const key = vertexKey(vertex);
    if (!adjacency.has(key)) {
      adjacency.set(key, []);
    }
    return adjacency.get(key);
  };
  for (const edge of edges) {
    const [u, v] = edge;
    neighborsOf(u).push({ vertex: v, edge });
    neighborsOf(v).push({ vertex: u, edge });
  }
  return adjacency;
}

// HELPER FUNCTIONS - PATH RECONSTRUCTION

/** Maps each vertex reachable from root to { vertex: parent, edge: parentEdge }. */
function _parentsFromRoot(adjacency, root) {
  const parentByKey = new Map();
  const visited = new Set([vertexKey(root)]);
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adjacency.get(vertexKey(current)) ?? [];
    for (const { vertex: neighbor, edge } of neighbors) {
      const neighborKey = vertexKey(neighbor);
      if (visited.has(neighborKey)) {
        continue;
      }
      visited.add(neighborKey);
      parentByKey.set(neighborKey, { vertex: current, edge });
      queue.push(neighbor);
    }
  }
  return parentByKey;
}

function _pathEdgeKeysToRoot(parentByKey, from) {
  const keys = new Set();
  let currentKey = vertexKey(from);
  while (parentByKey.has(currentKey)) {
    const { vertex: parent, edge } = parentByKey.get(currentKey);
    keys.add(edgeKey(edge[0], edge[1]));
    currentKey = vertexKey(parent);
  }
  return keys;
}

// PUBLIC INTERFACE

/** Subset of `edges` (original relative order) lying on some path connecting two specials. */
export function identifyConnectingEdges(edges, dsu, specialSubset) {
  if (specialSubset.length < 2) {
    return [];
  }
  const [root, ...rest] = specialSubset;
  const adjacency = _buildAdjacency(edges);
  const parentByKey = _parentsFromRoot(adjacency, root);

  const connectingKeys = new Set();
  for (const special of rest) {
    if (!dsu.connected(root, special)) {
      continue;
    }
    for (const key of _pathEdgeKeysToRoot(parentByKey, special)) {
      connectingKeys.add(key);
    }
  }

  return edges.filter(([u, v]) => connectingKeys.has(edgeKey(u, v)));
}
