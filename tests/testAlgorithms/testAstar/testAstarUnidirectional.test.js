/**
 * heuristicFn defaults to A*'s own built-in straight-line heuristic, swappable per call
 */
import { describe, expect, it } from "vitest";

import * as astar from "../../../algorithms/parametrization/astar.js";
import * as dijkstra from "../../../algorithms/parametrization/dijkstra.js";
import { drainEdges } from "../../../algorithms/skeleton/greedyAlgorithm.js";

const ZERO_HEURISTIC = () => 0;

function vertexKey([x, y]) {
  return `${x},${y}`;
}

function euclidean([ux, uy], [vx, vy]) {
  return Math.hypot(ux - vx, uy - vy);
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

describe("astarUnidirectional", () => {
  describe("AC8: zero heuristic degenerates to Dijkstra", () => {
    it("accepts the exact same edges in the exact same order as dijkstraUnidirectional.js", () => {
      const allVertices = [
        [0, 0], [2, 1], [4, 0], [1, 3], [3, 3], [5, 2], [6, 0],
      ];
      const special = [allVertices[0], allVertices[3], allVertices[6]];

      const astarEdges = [...astar.growEdgesUnidirectionalStepwise(allVertices, special, ZERO_HEURISTIC)];
      const dijkstraEdges = [...dijkstra.growEdgesUnidirectionalStepwise(allVertices, special)];

      expect(astarEdges.map((e) => e.map(vertexKey))).toEqual(dijkstraEdges.map((e) => e.map(vertexKey)));
    });
  });

  describe("AC10: vacuous termination for fewer than 2 specials", () => {
    it("yields no edges for zero special vertices", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const edges = [...astar.growEdgesUnidirectionalStepwise(allVertices, [])];
      expect(edges).toEqual([]);
    });

    it("yields no edges for exactly one special vertex", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const edges = [...astar.growEdgesUnidirectionalStepwise(allVertices, [allVertices[0]])];
      expect(edges).toEqual([]);
    });
  });

  describe("A12: heuristic is a caller-supplied, swappable input", () => {
    it("produces a different edge order for a deliberately misleading heuristic than for the zero heuristic", () => {
      const allVertices = [
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [0, 5], [0, 10],
      ];
      const special = [allVertices[0], allVertices[5], allVertices[7]];
      const misleadingHeuristic = (vertex) => (vertex[1] > 0 ? 0 : 1000);

      const zeroEdges = [...astar.growEdgesUnidirectionalStepwise(allVertices, special, ZERO_HEURISTIC)];
      const misledEdges = [...astar.growEdgesUnidirectionalStepwise(allVertices, special, misleadingHeuristic)];

      expect(misledEdges.map((e) => e.map(vertexKey))).not.toEqual(zeroEdges.map((e) => e.map(vertexKey)));
    });
  });

  describe("FR14: optional edgeSet restricts candidate pairs", () => {
    it("omitting edgeSet still finds the complete-graph shortest path (direct edge)", () => {
      const allVertices = [[0, 0], [10, 0], [0, 3], [10, 3]];
      const special = [allVertices[0], allVertices[1]];

      const { edges } = drainEdges(astar.growEdgesUnidirectionalStepwise(allVertices, special, ZERO_HEURISTIC));
      const found = shortestPathInSubgraph(edges, special[0], special[1]);

      expect(found).toBeCloseTo(10, 9);
    });

    it("given edgeSet excluding the direct edge, finds shortest path within edgeSet, not complete-graph optimum", () => {
      const [a, b, c, d] = [[0, 0], [10, 0], [0, 3], [10, 3]];
      const allVertices = [a, b, c, d];
      const special = [a, b];
      const edgeSet = [[a, c], [c, d], [d, b]]; // excludes direct a-b edge (weight 10)

      const { edges, dsu } = drainEdges(astar.growEdgesUnidirectionalStepwise(allVertices, special, ZERO_HEURISTIC, edgeSet));

      expect(dsu.connected(a, b)).toBe(true);
      const found = shortestPathInSubgraph(edges, a, b);
      expect(found).toBeCloseTo(16, 9); // 3 + 10 + 3, not the complete-graph optimum of 10
    });

    it("given a disconnecting edgeSet, terminates without hanging and leaves specials separate", () => {
      const [a, b, c] = [[0, 0], [10, 0], [5, 5]];
      const allVertices = [a, b, c];
      const special = [a, b];
      const edgeSet = [[a, c]]; // never reaches b

      const { dsu } = drainEdges(astar.growEdgesUnidirectionalStepwise(allVertices, special, ZERO_HEURISTIC, edgeSet));

      expect(dsu.connected(a, b)).toBe(false);
      expect(dsu.componentCount()).toBeGreaterThan(1);
    });
  });
});
