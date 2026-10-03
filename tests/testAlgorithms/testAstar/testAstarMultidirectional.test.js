/**
 * heuristicFn defaults to A*'s own built-in straight-line heuristic, swappable per call, applied
 * independently on every frontier
 */
import { describe, expect, it } from "vitest";

import * as astarMultidirectional from "../../../algorithms/astar/astarMultidirectional.js";
import * as dijkstraMultidirectional from "../../../algorithms/dijkstra/dijkstraMultidirectional.js";

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

describe("astarMultidirectional", () => {
  describe("same connectivity guarantee as dijkstraMultidirectional", () => {
    it("connects every special into one DSU component on a scattered graph", () => {
      const allVertices = [
        [0, 0], [2, 1], [4, 0], [1, 3], [3, 3], [5, 2], [6, 0], [2, 5],
      ];
      const special = [allVertices[0], allVertices[6], allVertices[7]];

      const { dsu } = astarMultidirectional.growEdges(allVertices, special);

      for (let i = 0; i < special.length; i += 1) {
        for (let j = i + 1; j < special.length; j += 1) {
          expect(dsu.connected(special[i], special[j])).toBe(true);
        }
      }
    });
  });

  describe("same shortest-distance-correctness guarantee as dijkstraMultidirectional", () => {
    it("connects two specials with total edge weight equal to dijkstraMultidirectional's connecting distance", () => {
      const allVertices = [
        [0, 0], [1, 1], [3, 1], [5, 0], [2, 4], [4, 3],
      ];
      const special = [allVertices[0], allVertices[3]];

      const { edges: astarEdges } = astarMultidirectional.growEdges(allVertices, special);
      const { edges: dijkstraEdges } = dijkstraMultidirectional.growEdges(allVertices, special);

      const astarDistance = shortestPathInSubgraph(astarEdges, special[0], special[1]);
      const dijkstraDistance = shortestPathInSubgraph(dijkstraEdges, special[0], special[1]);

      expect(astarDistance).toBeCloseTo(dijkstraDistance, 9);
    });
  });

  describe("zero heuristic on every frontier degenerates to dijkstraMultidirectional", () => {
    it("produces the same total connecting distances as dijkstraMultidirectional given the same inputs", () => {
      const allVertices = [
        [0, 0], [2, 1], [4, 0], [1, 3], [3, 3], [5, 2], [6, 0],
      ];
      const special = [allVertices[0], allVertices[3], allVertices[6]];

      const { edges: astarEdges } = astarMultidirectional.growEdges(allVertices, special, ZERO_HEURISTIC);
      const { edges: dijkstraEdges } = dijkstraMultidirectional.growEdges(allVertices, special);

      for (let i = 0; i < special.length; i += 1) {
        for (let j = i + 1; j < special.length; j += 1) {
          const astarDistance = shortestPathInSubgraph(astarEdges, special[i], special[j]);
          const dijkstraDistance = shortestPathInSubgraph(dijkstraEdges, special[i], special[j]);

          if (Number.isFinite(astarDistance) || Number.isFinite(dijkstraDistance)) {
            expect(astarDistance).toBeCloseTo(dijkstraDistance, 9);
          }
        }
      }
    });
  });

  describe("vacuous termination for fewer than 2 specials", () => {
    it("yields no edges for zero special vertices", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const edges = [...astarMultidirectional.growEdgesStepwise(allVertices, [])];
      expect(edges).toEqual([]);
    });

    it("yields no edges for exactly one special vertex", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const edges = [...astarMultidirectional.growEdgesStepwise(allVertices, [allVertices[0]])];
      expect(edges).toEqual([]);
    });
  });
});
