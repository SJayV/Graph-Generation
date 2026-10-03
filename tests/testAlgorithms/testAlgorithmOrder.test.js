import { describe, expect, it } from "vitest";

import { ALGORITHM_NAMES, nextAlgorithmName } from "../../algorithms/algorithmOrder.js";

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
