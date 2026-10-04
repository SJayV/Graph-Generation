/**
 * priority key uses DSU (see testDsu.test.js) for find/isSpecial
 */
import { describe, expect, it } from "vitest";

import { DSU } from "../../../logic/dataStructures/dsu.js";
import { key } from "../../../logic/computation/field.js";

function makeFieldShape(sigma) {
  return { sigma, dampeningFactor: 0.1, strengtheningFactor: 10 };
}

function buildDsu(allVertices, specialSubset) {
  return new DSU(allVertices, specialSubset);
}

describe("field", () => {
  describe("TestFieldPurity", () => {
    it("key is deterministic for same inputs", () => {
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
      const fieldShape = makeFieldShape(2.0);

      const first = key(structure, [0, 0], [5, 5], fieldShape);
      const second = key(structure, [0, 0], [5, 5], fieldShape);
      expect(first).toBe(second);
    });

    it("key is unchanged when recomputed without state change", () => {
      const allVertices = [
        [0, 0],
        [1, 1],
      ];
      const structure = buildDsu(allVertices, [[0, 0]]);
      const fieldShape = makeFieldShape(1.5);

      const before = key(structure, [0, 0], [1, 1], fieldShape);
      const after = key(structure, [0, 0], [1, 1], fieldShape);
      expect(before).toBe(after);
    });
  });

  describe("TestFieldNonNegativity", () => {
    it("key is never negative", () => {
      const points = [
        [0, 0],
        [3, 3],
        [6, 6],
        [100, 100],
        [-50, -50],
      ];
      const structure = buildDsu(points, points.slice(0, 3));
      const fieldShape = makeFieldShape(4.0);

      for (const first of points) {
        for (const second of points) {
          expect(key(structure, first, second, fieldShape)).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe("TestFieldScalesWithSpecialVertexBoost", () => {
    it("key is strictly greater when one endpoint is itself special", () => {
      const allVertices = [
        [0, 0],
        [9, 9],
      ];
      const fieldShape = makeFieldShape(3.0);

      const structureWithoutSpecial = buildDsu(allVertices, []);
      const structureWithSpecial = buildDsu(allVertices, [[0, 0]]);

      const keyWithoutSpecial = key(structureWithoutSpecial, [0, 0], [9, 9], fieldShape);
      const keyWithSpecial = key(structureWithSpecial, [0, 0], [9, 9], fieldShape);

      expect(keyWithSpecial).toBeGreaterThan(keyWithoutSpecial);
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
      const fieldShape = makeFieldShape(2.0);

      const keyForward = key(structure, [0, 0], [4, 4], fieldShape);
      const keyBackward = key(structure, [4, 4], [0, 0], fieldShape);
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
      const fieldShape = makeFieldShape(2.0);

      const structureA = buildDsu(allVertices, special);
      structureA.union([0, 0], [1, 0]);

      const structureB = buildDsu(allVertices, special);
      structureB.union([0, 0], [1, 0]);
      structureB.union([1, 0], [0, 0]); // idempotent re-union, same eventual state

      const keyFromA = key(structureA, [2, 0], [3, 0], fieldShape);
      const keyFromB = key(structureB, [2, 0], [3, 0], fieldShape);
      expect(keyFromA).toBe(keyFromB);
    });
  });

  describe("TestFieldIsAnchoredToTheQueriedVertexNotToASpecialComponentMember", () => {
    it("key after union favours a probe near the queried vertex over one near a special member", () => {
      const special = [0, 0];
      const queried = [20, 20];
      const probe = [21, 20]; // right next to queried, far from special
      const structure = buildDsu([special, queried, probe], [special]);
      structure.union(special, queried);
      const fieldShape = makeFieldShape(3.0);

      const keyAtQueried = key(structure, probe, queried, fieldShape);
      const keyAtSpecial = key(structure, probe, special, fieldShape);

      expect(keyAtQueried).toBeGreaterThan(keyAtSpecial);
    });
  });
});
