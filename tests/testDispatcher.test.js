/**
 * uniform dispatcher entry point, forwarding only the subset of parameters
 * each selected algorithm actually takes.
 */
import { describe, expect, it } from "vitest";

import { ALGORITHM_NAMES, nextAlgorithmName, runAlgorithm } from "../dispatcher.js";

const SHORTEST_PATH_FAMILY_NAMES = [
  "dijkstraUnidirectional",
  "astarUnidirectional",
  "dijkstraMultidirectional",
  "astarMultidirectional",
];

describe("algorithmOrder", () => {
  describe("full-cycle consistency", () => {
    it("advancing ALGORITHM_NAMES.length times from any entry returns to that same entry", () => {
      for (const startingName of ALGORITHM_NAMES) {
        let currentName = startingName;
        for (let step = 0; step < ALGORITHM_NAMES.length; step += 1) {
          currentName = nextAlgorithmName(currentName);
        }
        expect(currentName).toBe(startingName);
      }
    });

    it("visits every name exactly once in one full cycle starting from generation", () => {
      const visited = [];
      let currentName = ALGORITHM_NAMES[0];
      for (let step = 0; step < ALGORITHM_NAMES.length; step += 1) {
        visited.push(currentName);
        currentName = nextAlgorithmName(currentName);
      }
      expect(new Set(visited).size).toBe(ALGORITHM_NAMES.length);
    });
  });
});

describe("dispatcher", () => {
  describe("generation entry", () => {
    it("returns edgeSet undefined regardless of what edgeSet argument was passed", () => {
      const allVertices = [[0, 0], [1, 0], [2, 1], [3, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];
      const suppliedEdgeSet = [[allVertices[0], allVertices[1]]];

      const withEdgeSet = runAlgorithm("generation", allVertices, specialSubset, suppliedEdgeSet);
      const withoutEdgeSet = runAlgorithm("generation", allVertices, specialSubset, undefined);

      expect(withEdgeSet.edgeSet).toBeUndefined();
      expect(withoutEdgeSet.edgeSet).toBeUndefined();
    });

    it("produces a real run of generation.growEdges: dsu covers every vertex, with a non-trivial accepted edge set", () => {
      const allVertices = Array.from({ length: 8 }, (_, i) => [i, 0]);
      const specialSubset = [allVertices[0], allVertices[1]];

      const { edges, dsu } = runAlgorithm("generation", allVertices, specialSubset, undefined);

      for (const vertex of allVertices) {
        expect(dsu.find(vertex)).toBeDefined();
      }
      expect(edges.length).toBeGreaterThan(0);
      const maxPossibleEdges = (allVertices.length * (allVertices.length - 1)) / 2;
      expect(edges.length).toBeLessThanOrEqual(maxPossibleEdges);
    });
  });

  describe.each(SHORTEST_PATH_FAMILY_NAMES)("%s entry", (algorithmName) => {
    it("echoes the given edgeSet through unchanged (same reference, not mutated)", () => {
      const allVertices = [[0, 0], [10, 0], [0, 3], [10, 3]];
      const specialSubset = [allVertices[0], allVertices[1]];
      const edgeSet = [
        [allVertices[0], allVertices[2]],
        [allVertices[2], allVertices[3]],
        [allVertices[3], allVertices[1]],
      ];
      const edgeSetSnapshot = edgeSet.map((pair) => [...pair]);

      const result = runAlgorithm(algorithmName, allVertices, specialSubset, edgeSet);

      expect(result.edgeSet).toBe(edgeSet);
      expect(edgeSet).toEqual(edgeSetSnapshot);
    });

    it("produces correct connectivity on a small hand-constructed graph (every special shares one DSU root)", () => {
      const allVertices = [
        [0, 0], [1, 1], [3, 1], [5, 0], [2, 4], [4, 3],
      ];
      const specialSubset = [allVertices[0], allVertices[3], allVertices[4]];

      const { dsu } = runAlgorithm(algorithmName, allVertices, specialSubset, undefined);

      for (let i = 0; i < specialSubset.length; i += 1) {
        for (let j = i + 1; j < specialSubset.length; j += 1) {
          expect(dsu.connected(specialSubset[i], specialSubset[j])).toBe(true);
        }
      }
    });
  });

  describe("optional displayTarget parameter (Story 8 AC7/AC8: display updates alongside algorithm run)", () => {
    it("overwrites whatever textContent the displayTarget previously held", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];
      const displayTarget = { textContent: "stale previous label" };

      runAlgorithm("dijkstraUnidirectional", allVertices, specialSubset, undefined, displayTarget);

      expect(displayTarget.textContent).toBe("Dijkstra - Unidirectional");
    });

    it("omitting displayTarget entirely attempts no DOM/text side effect and does not throw", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];

      expect(() => runAlgorithm("generation", allVertices, specialSubset, undefined)).not.toThrow();
    });
  });

  describe("vacuous termination for fewer than 2 specials (shortest-path family, mirrors A6)", () => {
    it.each(SHORTEST_PATH_FAMILY_NAMES)("%s yields no edges for a single special vertex", (algorithmName) => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0]];

      const { edges } = runAlgorithm(algorithmName, allVertices, specialSubset, undefined);

      expect(edges).toEqual([]);
    });
  });
});
