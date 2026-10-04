/** parameters.js is the single source of truth for generation tunables. */
import { describe, expect, it } from "vitest";

import * as parameters from "../parameters.js";

function _isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function _isPositiveNumber(value) {
  return typeof value === "number" && value > 0;
}

describe("parameters", () => {
  describe("TestExportedValues (AC1)", () => {
    it("exports a positive integer vertex count", () => {
      expect(_isPositiveInteger(parameters.VERTEX_COUNT)).toBe(true);
    });

    it("exports a positive integer grid size", () => {
      expect(_isPositiveInteger(parameters.GRID_SIZE)).toBe(true);
    });

    it("exports a non-negative integer special-subset size", () => {
      expect(Number.isInteger(parameters.SPECIAL_SUBSET_SIZE)).toBe(true);
      expect(parameters.SPECIAL_SUBSET_SIZE).toBeGreaterThanOrEqual(0);
    });

    it("exports a positive sparsity multiplier", () => {
      expect(_isPositiveNumber(parameters.SPARSITY)).toBe(true);
    });

    it("exports a positive integer nearest-neighbor count", () => {
      expect(_isPositiveInteger(parameters.NEAREST_NEIGHBOR_COUNT)).toBe(true);
    });

    it("does not export a sigma value - sigma stays derived, not stored (PLAN.md Ideas / FR5)", () => {
      expect(parameters.SIGMA).toBeUndefined();
      expect(parameters.SIGMA_TUNING_CONSTANT).toBeUndefined();
    });
  });

  describe("TestDomainCoherence", () => {
    it("special-subset size does not exceed vertex count (reuses selectSpecialSubset's own bound)", () => {
      expect(parameters.SPECIAL_SUBSET_SIZE).toBeLessThanOrEqual(parameters.VERTEX_COUNT);
    });

    it("nearest-neighbor count leaves at least one other vertex to connect to and is less than the vertex count", () => {
      expect(parameters.NEAREST_NEIGHBOR_COUNT).toBeGreaterThanOrEqual(1);
      expect(parameters.NEAREST_NEIGHBOR_COUNT).toBeLessThan(parameters.VERTEX_COUNT);
    });
  });
});
