/**
 * algorithms/dijkstra.js: growEdgesStepwise(allVertices, specialSubset), growEdges(allVertices, specialSubset)
 * multi-source Dijkstra: every special starts at distance 0, shared priority queue
 * complete graph, Euclidean weights - direct verification against an independent reference
 */
import { describe, expect, it } from "vitest";

import * as dijkstra from "../../algorithms/dijkstra.js";

const EPSILON = 1e-9;

function vertexKey([x, y]) {
  return `${x},${y}`;
}

function euclidean([ux, uy], [vx, vy]) {
  return Math.hypot(ux - vx, uy - vy);
}

// independent multi-source reference: true distance to nearest special, complete graph
function bruteForceDistanceToNearestSpecial(allVertices, specialSubset) {
  const distances = new Map();
  for (const v of allVertices) {
    const best = Math.min(...specialSubset.map((s) => euclidean(v, s)));
    distances.set(vertexKey(v), best);
  }
  return distances;
}

// independent single-pair reference Dijkstra over the complete graph
function bruteForceShortestPath(allVertices, source, target) {
  const unvisited = new Set(allVertices.map(vertexKey));
  const byKey = new Map(allVertices.map((v) => [vertexKey(v), v]));
  const dist = new Map(allVertices.map((v) => [vertexKey(v), Infinity]));
  dist.set(vertexKey(source), 0);

  while (unvisited.size > 0) {
    let currentKey = null;
    let currentDist = Infinity;
    for (const key of unvisited) {
      if (dist.get(key) < currentDist) {
        currentDist = dist.get(key);
        currentKey = key;
      }
    }
    if (currentKey === null || currentKey === vertexKey(target)) {
      break;
    }
    unvisited.delete(currentKey);
    const current = byKey.get(currentKey);
    for (const other of allVertices) {
      const otherKey = vertexKey(other);
      if (!unvisited.has(otherKey)) {
        continue;
      }
      const candidate = currentDist + euclidean(current, other);
      if (candidate < dist.get(otherKey)) {
        dist.set(otherKey, candidate);
      }
    }
  }
  return dist.get(vertexKey(target));
}

// shortest path weight reachable using only the accepted-edge subgraph
function shortestPathInSubgraph(edges, source, target) {
  const adjacency = new Map();
  const ensureNode = (v) => {
    if (!adjacency.has(vertexKey(v))) {
      adjacency.set(vertexKey(v), []);
    }
  };
  for (const [u, v] of edges) {
    ensureNode(u);
    ensureNode(v);
    const w = euclidean(u, v);
    adjacency.get(vertexKey(u)).push({ to: v, w });
    adjacency.get(vertexKey(v)).push({ to: u, w });
  }

  const dist = new Map([[vertexKey(source), 0]]);
  const unvisited = new Set(adjacency.keys());
  while (unvisited.size > 0) {
    let currentKey = null;
    let currentDist = Infinity;
    for (const key of unvisited) {
      const d = dist.has(key) ? dist.get(key) : Infinity;
      if (d < currentDist) {
        currentDist = d;
        currentKey = key;
      }
    }
    if (currentKey === null) {
      break;
    }
    unvisited.delete(currentKey);
    if (currentKey === vertexKey(target)) {
      break;
    }
    for (const { to, w } of adjacency.get(currentKey)) {
      const toKey = vertexKey(to);
      const candidate = currentDist + w;
      if (candidate < (dist.has(toKey) ? dist.get(toKey) : Infinity)) {
        dist.set(toKey, candidate);
      }
    }
  }
  return dist.get(vertexKey(target));
}

describe("dijkstra", () => {
  describe("AC4: reaches full special-vertex connectivity", () => {
    it("connects every special into one DSU component on a scattered graph", () => {
      const allVertices = [
        [0, 0], [2, 1], [4, 0], [1, 3], [3, 3], [5, 2], [6, 0], [2, 5],
      ];
      const special = [allVertices[0], allVertices[6], allVertices[7]];

      const { dsu } = dijkstra.growEdges(allVertices, special);

      for (let i = 0; i < special.length; i += 1) {
        for (let j = i + 1; j < special.length; j += 1) {
          expect(dsu.connected(special[i], special[j])).toBe(true);
        }
      }
    });
  });

  describe("AC5: monotonic non-decreasing accepted-edge priority", () => {
    it("never settles a farther vertex before a closer one, on a symmetric chain", () => {
      const allVertices = [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0]];
      const special = [allVertices[0], allVertices[5]];
      const trueDist = bruteForceDistanceToNearestSpecial(allVertices, special);

      const connected = new Set(special.map(vertexKey));
      let runningMax = 0;
      for (const [u, v] of dijkstra.growEdgesStepwise(allVertices, special)) {
        const uKey = vertexKey(u);
        const vKey = vertexKey(v);
        const uIsNew = !connected.has(uKey);
        const vIsNew = !connected.has(vKey);

        if (uIsNew || vIsNew) {
          const newlySettledKey = uIsNew ? uKey : vKey;
          const priority = trueDist.get(newlySettledKey);
          expect(priority).toBeGreaterThanOrEqual(runningMax - EPSILON);
          runningMax = Math.max(runningMax, priority);
        }
        connected.add(uKey);
        connected.add(vKey);
      }
    });
  });

  describe("AC6: shortest-path correctness on a hand-constructed graph", () => {
    it("connects two specials with total edge weight equal to the true shortest-path distance", () => {
      const allVertices = [
        [0, 0], [1, 1], [3, 1], [5, 0], [2, 4], [4, 3],
      ];
      const special = [allVertices[0], allVertices[3]];

      const { edges } = dijkstra.growEdges(allVertices, special);

      const found = shortestPathInSubgraph(edges, special[0], special[1]);
      const truth = bruteForceShortestPath(allVertices, special[0], special[1]);

      expect(found).toBeCloseTo(truth, 9);
    });
  });

  describe("AC10: vacuous termination for fewer than 2 specials", () => {
    it("yields no edges for zero special vertices", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const edges = [...dijkstra.growEdgesStepwise(allVertices, [])];
      expect(edges).toEqual([]);
    });

    it("yields no edges for exactly one special vertex", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const edges = [...dijkstra.growEdgesStepwise(allVertices, [allVertices[0]])];
      expect(edges).toEqual([]);
    });
  });
});
