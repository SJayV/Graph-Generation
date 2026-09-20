/**
 * logic/dsu.js: DSU class - find, union, componentCount
 * vertices as [x, y] arrays, resolved by value not reference
 */
import { describe, expect, it } from "vitest";

import { DSU } from "../../logic/dsu.js";

function buildDsu(allVertices, specialSubset) {
  return new DSU(allVertices, specialSubset);
}

describe("DSU", () => {
  describe("TestPartitionProperty", () => {
    it("every vertex resolves to a single stable root", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ];
      const special = [
        [0, 0],
        [2, 0],
      ];
      const structure = buildDsu(allVertices, special);
      structure.union([0, 0], [1, 0]);

      const rootsOfEachVertex = allVertices.map((vertex) => structure.find(vertex));
      allVertices.forEach((vertex, index) => {
        expect(structure.find(vertex)).toEqual(rootsOfEachVertex[index]);
      });
    });

    it("component count never exceeds vertex count", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const structure = buildDsu(allVertices, []);
      expect(structure.componentCount()).toBeLessThanOrEqual(allVertices.length);
    });
  });

  describe("TestSingletonInitialization", () => {
    it("every vertex is in its own component before any union", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const structure = buildDsu(allVertices, []);
      const roots = new Set(allVertices.map((vertex) => JSON.stringify(structure.find(vertex))));
      expect(roots.size).toBe(allVertices.length);
    });

    it("component count equals vertex count before any union", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ];
      const structure = buildDsu(allVertices, []);
      expect(structure.componentCount()).toBe(allVertices.length);
    });
  });

  describe("TestUnionIdempotence", () => {
    it("reunion of already merged vertices does not change component count", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const structure = buildDsu(allVertices, []);
      structure.union([0, 0], [1, 0]);

      const componentsBefore = structure.componentCount();
      structure.union([0, 0], [1, 0]);
      expect(structure.componentCount()).toBe(componentsBefore);
    });
  });

  describe("TestMonotonicComponentCount", () => {
    it("component count never increases after a sequence of unions", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ];
      const structure = buildDsu(allVertices, []);

      const history = [structure.componentCount()];
      structure.union([0, 0], [1, 0]);
      history.push(structure.componentCount());
      structure.union([2, 0], [3, 0]);
      history.push(structure.componentCount());
      structure.union([0, 0], [2, 0]);
      history.push(structure.componentCount());

      for (let i = 1; i < history.length; i += 1) {
        expect(history[i]).toBeLessThanOrEqual(history[i - 1]);
      }
    });
  });

  // Fresh array literal, distinct reference, same coordinates.
  describe("TestValueEqualityAcrossReferences", () => {
    it("resolves a vertex passed as a fresh array literal with equal coordinates", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
      ];
      const structure = buildDsu(allVertices, []);

      const rootFromConstructionReference = structure.find(allVertices[0]);
      const rootFromFreshReference = structure.find([0, 0]);

      expect(rootFromFreshReference).toEqual(rootFromConstructionReference);
    });
  });

  describe("TestIsSpecialInvariant", () => {
    it("returns true for a vertex that is a member of the special subset", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const special = [[0, 0]];
      const structure = buildDsu(allVertices, special);

      expect(structure.isSpecial([0, 0])).toBe(true);
    });

    it("returns false for a vertex that is not a member of the special subset", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const special = [[0, 0]];
      const structure = buildDsu(allVertices, special);

      expect(structure.isSpecial([1, 0])).toBe(false);
    });

    it("is unaffected by union with a non-special vertex, for both operands", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const special = [[0, 0]];
      const structure = buildDsu(allVertices, special);

      const specialBefore = structure.isSpecial([0, 0]);
      const nonSpecialBefore = structure.isSpecial([1, 0]);

      structure.union([0, 0], [1, 0]);

      expect(structure.isSpecial([0, 0])).toBe(specialBefore);
      expect(structure.isSpecial([1, 0])).toBe(nonSpecialBefore);
      expect(structure.isSpecial([0, 0])).toBe(true);
      expect(structure.isSpecial([1, 0])).toBe(false);
    });

    it("resolves membership for a vertex passed as a fresh array literal with equal coordinates", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
      ];
      const special = [[0, 0]];
      const structure = buildDsu(allVertices, special);

      expect(structure.isSpecial([0, 0])).toBe(structure.isSpecial(allVertices[0]));
      expect(structure.isSpecial([0, 0])).toBe(true);
    });
  });

  describe("TestComponentSizeInvariant", () => {
    it("a freshly-constructed vertex has componentSize 1 before any union", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const structure = buildDsu(allVertices, []);

      expect(structure.componentSize([0, 0])).toBe(1);
      expect(structure.componentSize([1, 0])).toBe(1);
      expect(structure.componentSize([2, 0])).toBe(1);
    });

    it("componentSize is 2 for both members after unioning two vertices", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
      ];
      const structure = buildDsu(allVertices, []);

      structure.union([0, 0], [1, 0]);

      expect(structure.componentSize([0, 0])).toBe(2);
      expect(structure.componentSize([1, 0])).toBe(2);
    });

    it("componentSize grows correctly across a chain of unions, unrelated vertex stays a singleton", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ];
      const structure = buildDsu(allVertices, []);

      structure.union([0, 0], [1, 0]);
      structure.union([1, 0], [2, 0]);

      expect(structure.componentSize([0, 0])).toBe(3);
      expect(structure.componentSize([1, 0])).toBe(3);
      expect(structure.componentSize([2, 0])).toBe(3);
      expect(structure.componentSize([3, 0])).toBe(1);
    });

    it("resolves componentSize for a vertex passed as a fresh array literal with equal coordinates", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
      ];
      const structure = buildDsu(allVertices, []);
      structure.union([0, 0], [1, 0]);

      expect(structure.componentSize([0, 0])).toBe(structure.componentSize(allVertices[0]));
      expect(structure.componentSize([0, 0])).toBe(2);
    });
  });

  describe("connected", () => {
    it("returns true for two vertices merged by union", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const structure = buildDsu(allVertices, []);
      structure.union([0, 0], [1, 0]);

      expect(structure.connected([0, 0], [1, 0])).toBe(true);
    });

    it("returns false for two vertices in different components", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const structure = buildDsu(allVertices, []);

      expect(structure.connected([0, 0], [2, 0])).toBe(false);
    });

    it("returns true for a vertex compared with itself", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
      ];
      const structure = buildDsu(allVertices, []);

      expect(structure.connected([0, 0], [0, 0])).toBe(true);
    });

    it("returns false for a vertex outside the DSU's vertex set", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
      ];
      const structure = buildDsu(allVertices, []);

      expect(structure.connected([0, 0], [99, 99])).toBe(false);
    });

    it("is symmetric regardless of argument order", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
      ];
      const structure = buildDsu(allVertices, []);
      structure.union([0, 0], [1, 0]);

      expect(structure.connected([0, 0], [1, 0])).toBe(structure.connected([1, 0], [0, 0]));
      expect(structure.connected([0, 0], [2, 0])).toBe(structure.connected([2, 0], [0, 0]));
    });
  });
});
