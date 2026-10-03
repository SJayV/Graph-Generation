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
  describe("fixed ordered algorithm list", () => {
    it("has exactly 5 entries", () => {
      expect(ALGORITHM_NAMES.length).toBe(5);
    });

    it("starts with generation first (AC1)", () => {
      expect(ALGORITHM_NAMES[0]).toBe("generation");
    });

    it("contains the exact 5 algorithm identifiers, in the resolved order", () => {
      expect(ALGORITHM_NAMES).toEqual([
        "generation",
        "dijkstraUnidirectional",
        "astarUnidirectional",
        "dijkstraMultidirectional",
        "astarMultidirectional",
      ]);
    });
  });

  describe("nextAlgorithmName advances through the list (AC2)", () => {
    it("advances from generation to dijkstraUnidirectional", () => {
      expect(nextAlgorithmName("generation")).toBe("dijkstraUnidirectional");
    });

    it("advances from dijkstraUnidirectional to astarUnidirectional", () => {
      expect(nextAlgorithmName("dijkstraUnidirectional")).toBe("astarUnidirectional");
    });

    it("advances from astarUnidirectional to dijkstraMultidirectional", () => {
      expect(nextAlgorithmName("astarUnidirectional")).toBe("dijkstraMultidirectional");
    });

    it("advances from dijkstraMultidirectional to astarMultidirectional", () => {
      expect(nextAlgorithmName("dijkstraMultidirectional")).toBe("astarMultidirectional");
    });
  });

  describe("nextAlgorithmName wraps from the last entry back to the first (AC3)", () => {
    it("advances from astarMultidirectional (last) back to generation (first)", () => {
      expect(nextAlgorithmName("astarMultidirectional")).toBe("generation");
    });
  });

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
      let currentName = "generation";
      for (let step = 0; step < ALGORITHM_NAMES.length; step += 1) {
        visited.push(currentName);
        currentName = nextAlgorithmName(currentName);
      }
      expect(new Set(visited).size).toBe(ALGORITHM_NAMES.length);
    });
  });
});

describe("dispatcher", () => {
  describe("ALGORITHM_NAMES coverage", () => {
    it("runAlgorithm recognizes every name in the fixed ordered list", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];

      for (const algorithmName of ALGORITHM_NAMES) {
        expect(() => runAlgorithm(algorithmName, allVertices, specialSubset, undefined)).not.toThrow();
      }
    });
  });

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

    it("never passes a custom heuristic: behaves identically to calling the underlying algorithm's growEdges with its default heuristic", () => {
      const allVertices = [[0, 0], [2, 1], [4, 0], [1, 3], [3, 3], [5, 2]];
      const specialSubset = [allVertices[0], allVertices[2]];

      const { edges, dsu } = runAlgorithm(algorithmName, allVertices, specialSubset, undefined);

      expect(dsu.connected(specialSubset[0], specialSubset[1])).toBe(true);
      expect(Array.isArray(edges)).toBe(true);
    });
  });

  describe("uniform return shape", () => {
    it("every algorithm name returns an object with exactly edges, dsu, and edgeSet keys", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];

      for (const algorithmName of ALGORITHM_NAMES) {
        const result = runAlgorithm(algorithmName, allVertices, specialSubset, undefined);
        expect(Object.keys(result).sort()).toEqual(["dsu", "edgeSet", "edges"]);
      }
    });
  });

  describe("optional displayTarget parameter (Story 8 AC7/AC8: display updates alongside algorithm run)", () => {
    it("sets displayTarget.textContent to the algorithm name when displayTarget is provided", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];
      const displayTarget = { textContent: "" };

      runAlgorithm("generation", allVertices, specialSubset, undefined, displayTarget);

      expect(displayTarget.textContent).toBe("Generation");
    });

    it("sets displayTarget.textContent correctly for a different algorithm name too", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];
      const displayTarget = { textContent: "" };

      runAlgorithm("astarMultidirectional", allVertices, specialSubset, undefined, displayTarget);

      expect(displayTarget.textContent).toBe("A* - Multidirectional");
    });

    it("overwrites whatever textContent the displayTarget previously held", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];
      const displayTarget = { textContent: "stale previous label" };

      runAlgorithm("dijkstraUnidirectional", allVertices, specialSubset, undefined, displayTarget);

      expect(displayTarget.textContent).toBe("Dijkstra - Unidirectional");
    });

    it("accepts a plain duck-typed stub object (no real DOM API needed, only textContent is assigned)", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];
      const displayTarget = { textContent: null };

      expect(() => runAlgorithm("generation", allVertices, specialSubset, undefined, displayTarget)).not.toThrow();
      expect(displayTarget.textContent).toBe("Generation");
    });

    it("omitting displayTarget entirely attempts no DOM/text side effect and does not throw", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];

      expect(() => runAlgorithm("generation", allVertices, specialSubset, undefined)).not.toThrow();
      expect(() => runAlgorithm("generation", allVertices, specialSubset, undefined, undefined)).not.toThrow();
    });

    it("return shape stays exactly edges, dsu, edgeSet even when displayTarget is provided", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0]];
      const specialSubset = [allVertices[0], allVertices[1]];
      const displayTarget = { textContent: "" };

      const result = runAlgorithm("generation", allVertices, specialSubset, undefined, displayTarget);

      expect(Object.keys(result).sort()).toEqual(["dsu", "edgeSet", "edges"]);
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

describe("algorithmOrder + dispatcher integration", () => {
  it("cycling through every name in ALGORITHM_NAMES via runAlgorithm never throws, on the same small graph", () => {
    const allVertices = [[0, 0], [2, 1], [4, 0], [1, 3], [3, 3], [5, 2]];
    const specialSubset = [allVertices[0], allVertices[2], allVertices[4]];

    for (const algorithmName of ALGORITHM_NAMES) {
      expect(() => runAlgorithm(algorithmName, allVertices, specialSubset, undefined)).not.toThrow();
    }
  });
});
