/** parameters.js is the single source of truth for generation tunables. */
import { describe, expect, it } from "vitest";

import { GRID_SIZE, NEAREST_NEIGHBOR_COUNT, SPARSITY, SPECIAL_SUBSET_SIZE, VERTEX_COUNT } from "../parameters.js";

function _isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function _isPositiveNumber(value) {
  return typeof value === "number" && value > 0;
}

describe("parameters", () => {
  describe("TestExportedValues (AC1)", () => {
    it("exports a positive integer vertex count", () => {
      expect(_isPositiveInteger(VERTEX_COUNT)).toBe(true);
    });

    it("exports a positive integer grid size", () => {
      expect(_isPositiveInteger(GRID_SIZE)).toBe(true);
    });

    it("exports a non-negative integer special-subset size", () => {
      expect(Number.isInteger(SPECIAL_SUBSET_SIZE)).toBe(true);
      expect(SPECIAL_SUBSET_SIZE).toBeGreaterThanOrEqual(0);
    });

    it("exports a positive sparsity multiplier", () => {
      expect(_isPositiveNumber(SPARSITY)).toBe(true);
    });

    it("exports a positive integer nearest-neighbor count", () => {
      expect(_isPositiveInteger(NEAREST_NEIGHBOR_COUNT)).toBe(true);
    });
  });

  describe("TestDomainCoherence", () => {
    it("special-subset size does not exceed vertex count (reuses selectSpecialSubset's own bound)", () => {
      expect(SPECIAL_SUBSET_SIZE).toBeLessThanOrEqual(VERTEX_COUNT);
    });

    it("nearest-neighbor count leaves at least one other vertex to connect to and is less than the vertex count", () => {
      expect(NEAREST_NEIGHBOR_COUNT).toBeGreaterThanOrEqual(1);
      expect(NEAREST_NEIGHBOR_COUNT).toBeLessThan(VERTEX_COUNT);
    });
  });
});
