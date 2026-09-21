/**
 * logic/distance.js: distance(u, v)
 * Euclidean weight primitive shared by every Story 5 algorithm.
 */
import { describe, expect, it } from "vitest";

import { distance } from "../../logic/distance.js";

describe("distance", () => {
  describe("TestKnownValues", () => {
    it("returns the Euclidean distance for a 3-4-5 triangle", () => {
      expect(distance([0, 0], [3, 4])).toBe(5);
    });

    it("returns the straight-line distance for axis-aligned points", () => {
      expect(distance([0, 0], [7, 0])).toBe(7);
    });
  });

  describe("TestZeroIffSamePosition", () => {
    it("returns 0 for identical coordinates", () => {
      expect(distance([2, 3], [2, 3])).toBe(0);
    });

    it("returns 0 for distinct references with equal coordinates", () => {
      expect(distance([1, 1], [1, 1])).toBe(0);
    });

    it("returns a positive value for any distinct position", () => {
      expect(distance([0, 0], [0, 1])).toBeGreaterThan(0);
      expect(distance([0, 0], [1, 0])).toBeGreaterThan(0);
    });
  });

  describe("TestSymmetry", () => {
    it("is unaffected by argument order", () => {
      const a = [1, 2];
      const b = [8, -3];
      expect(distance(a, b)).toBe(distance(b, a));
    });
  });
});
