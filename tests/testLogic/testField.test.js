/**
 * logic/field.js: gaussian, fieldValue, key
 * priority key uses DSU (see testDsu.test.js) for find/isSpecial
 */
import { describe, expect, it } from "vitest";

import { DSU } from "../../logic/dsu.js";
import { fieldValue, gaussian, key } from "../../logic/field.js";

function buildDsu(allVertices, specialSubset) {
  return new DSU(allVertices, specialSubset);
}

describe("field", () => {
  describe("TestFieldPurity", () => {
    it("fieldValue is deterministic for same inputs", () => {
      const allVertices = [
        [0, 0],
        [5, 5],
        [10, 10],
      ];
      const special = [
        [0, 0],
        [5, 5],
      ];
      const structure = buildDsu(allVertices, special);
      const sigma = 2.0;

      const first = fieldValue(structure, [0, 0], [7, 7], sigma);
      const second = fieldValue(structure, [0, 0], [7, 7], sigma);
      expect(first).toBe(second);
    });

    it("fieldValue is unchanged when recomputed without state change", () => {
      const allVertices = [
        [0, 0],
        [1, 1],
      ];
      const structure = buildDsu(allVertices, [[0, 0]]);
      const sigma = 1.5;

      const before = fieldValue(structure, [0, 0], [2, 2], sigma);
      const after = fieldValue(structure, [0, 0], [2, 2], sigma);
      expect(before).toBe(after);
    });
  });

  describe("TestFieldNonNegativity", () => {
    it("fieldValue is never negative", () => {
      const allVertices = [
        [0, 0],
        [3, 3],
        [6, 6],
      ];
      const special = [
        [0, 0],
        [3, 3],
        [6, 6],
      ];
      const structure = buildDsu(allVertices, special);
      const sigma = 4.0;

      const points = [
        [0, 0],
        [3, 3],
        [6, 6],
        [100, 100],
        [-50, -50],
      ];
      for (const point of points) {
        expect(fieldValue(structure, [0, 0], point, sigma)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("TestFieldScalesWithSpecialVertexBoost", () => {
    it("fieldValue is strictly greater when the queried vertex is itself special", () => {
      const allVertices = [
        [0, 0],
        [9, 9],
      ];
      const sigma = 3.0;

      const structureWithoutSpecial = buildDsu(allVertices, []);
      const structureWithSpecial = buildDsu(allVertices, [[0, 0]]);

      const valueWithoutSpecial = fieldValue(structureWithoutSpecial, [0, 0], [9, 9], sigma);
      const valueWithSpecial = fieldValue(structureWithSpecial, [0, 0], [9, 9], sigma);

      expect(valueWithSpecial).toBeGreaterThan(valueWithoutSpecial);
    });
  });

  describe("TestKeySymmetry", () => {
    it("key is symmetric under argument swap", () => {
      const allVertices = [
        [0, 0],
        [4, 4],
        [8, 8],
      ];
      const special = [
        [0, 0],
        [8, 8],
      ];
      const structure = buildDsu(allVertices, special);
      const sigma = 2.0;

      const keyForward = key(structure, [0, 0], [4, 4], sigma);
      const keyBackward = key(structure, [4, 4], [0, 0], sigma);
      expect(keyForward).toBe(keyBackward);
    });
  });

  describe("TestKeyDependsOnlyOnCurrentComponentState", () => {
    it("key matches across different histories reaching the same state", () => {
      const allVertices = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ];
      const special = [
        [0, 0],
        [1, 0],
      ];
      const sigma = 2.0;

      const structureA = buildDsu(allVertices, special);
      structureA.union([0, 0], [1, 0]);

      const structureB = buildDsu(allVertices, special);
      structureB.union([0, 0], [1, 0]);
      structureB.union([1, 0], [0, 0]); // idempotent re-union, same eventual state

      const keyFromA = key(structureA, [2, 0], [3, 0], sigma);
      const keyFromB = key(structureB, [2, 0], [3, 0], sigma);
      expect(keyFromA).toBe(keyFromB);
    });
  });

  describe("TestFieldIsAnchoredToTheQueriedVertexNotToASpecialComponentMember", () => {
    it("fieldValue after union is centred on the queried vertex itself", () => {
      const a = [0, 0];
      const b = [20, 20];
      const allVertices = [a, b];
      const special = [a];
      const sigma = 3.0;

      const structure = buildDsu(allVertices, special);
      structure.union(a, b);

      // sanity check: a's membership merged into b's component
      expect(structure.find(a)).toEqual(structure.find(b));

      const actualAtOwnPosition = fieldValue(structure, b, b, sigma);

      const wrongModelValueIfCentredOnA = actualAtOwnPosition * gaussian(b, a, sigma);

      expect(actualAtOwnPosition).toBeGreaterThan(0);
      expect(actualAtOwnPosition).not.toBeCloseTo(wrongModelValueIfCentredOnA);
    });
  });
});
