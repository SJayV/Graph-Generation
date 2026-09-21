/**
 * algorithms/astar.js: growEdgesStepwise(allVertices, specialSubset, heuristicFn), growEdges(...)
 * heuristicFn defaults to logic/heuristic.js's defaultHeuristic, swappable per call
 */
import { describe, expect, it } from "vitest";

import * as astar from "../../algorithms/astar.js";
import * as dijkstra from "../../algorithms/dijkstra.js";

const ZERO_HEURISTIC = () => 0;

function vertexKey([x, y]) {
  return `${x},${y}`;
}

describe("astar", () => {
  describe("AC7: reaches full special-vertex connectivity", () => {
    it("connects every special into one DSU component, identically to Dijkstra's AC4", () => {
      const allVertices = [
        [0, 0], [2, 1], [4, 0], [1, 3], [3, 3], [5, 2], [6, 0], [2, 5],
      ];
      const special = [allVertices[0], allVertices[6], allVertices[7]];

      const { dsu } = astar.growEdges(allVertices, special);

      for (let i = 0; i < special.length; i += 1) {
        for (let j = i + 1; j < special.length; j += 1) {
          expect(dsu.connected(special[i], special[j])).toBe(true);
        }
      }
    });
  });

  describe("AC8: zero heuristic degenerates to Dijkstra", () => {
    it("accepts the exact same edges in the exact same order as dijkstra.js", () => {
      const allVertices = [
        [0, 0], [2, 1], [4, 0], [1, 3], [3, 3], [5, 2], [6, 0],
      ];
      const special = [allVertices[0], allVertices[3], allVertices[6]];

      const astarEdges = [...astar.growEdgesStepwise(allVertices, special, ZERO_HEURISTIC)];
      const dijkstraEdges = [...dijkstra.growEdgesStepwise(allVertices, special)];

      expect(astarEdges.map((e) => e.map(vertexKey))).toEqual(dijkstraEdges.map((e) => e.map(vertexKey)));
    });
  });

  describe("AC10: vacuous termination for fewer than 2 specials", () => {
    it("yields no edges for zero special vertices", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const edges = [...astar.growEdgesStepwise(allVertices, [])];
      expect(edges).toEqual([]);
    });

    it("yields no edges for exactly one special vertex", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const edges = [...astar.growEdgesStepwise(allVertices, [allVertices[0]])];
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

      const zeroEdges = [...astar.growEdgesStepwise(allVertices, special, ZERO_HEURISTIC)];
      const misledEdges = [...astar.growEdgesStepwise(allVertices, special, misleadingHeuristic)];

      expect(misledEdges.map((e) => e.map(vertexKey))).not.toEqual(zeroEdges.map((e) => e.map(vertexKey)));
    });
  });
});
