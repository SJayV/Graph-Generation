/** panel.js's validation is a pure function: staged values in, names of out-of-bounds values out. */
import { describe, expect, it } from "vitest";

import { validateStagedParameters } from "../panel.js";

const VALID_VALUES = {
  vertexCount: 400,
  gridSize: 1000,
  specialSubsetSize: 5,
  sparsity: 1.5,
  nearestNeighborCount: 4,
  dampeningFactor: 0.1,
  strengtheningFactor: 10,
  edgePacingMilliseconds: 30,
  screenMarginFraction: 0.15,
};

function _invalidNamesFor(overrides) {
  return [...validateStagedParameters({ ...VALID_VALUES, ...overrides })].sort();
}

describe("panel", () => {
  describe("TestValidateStagedParameters (AC6, FR17)", () => {
    it("reports nothing when every value is within bounds", () => {
      expect(_invalidNamesFor({})).toEqual([]);
    });

    it("reports exactly the offending values, and all of them", () => {
      expect(_invalidNamesFor({ sparsity: 0, screenMarginFraction: 0.5 })).toEqual([
        "screenMarginFraction",
        "sparsity",
      ]);
    });

    it("does not mutate its input", () => {
      const staged = { ...VALID_VALUES, sparsity: -1 };
      const snapshot = { ...staged };
      validateStagedParameters(staged);
      expect(staged).toEqual(snapshot);
    });

    it("reports a value that is not a number (e.g. an emptied input)", () => {
      expect(_invalidNamesFor({ sparsity: NaN })).toEqual(["sparsity"]);
    });
  });

  describe("TestSingleFieldBounds (AC6)", () => {
    it("grid size must be a positive integer", () => {
      expect(_invalidNamesFor({ gridSize: 1000 })).toEqual([]);
      expect(_invalidNamesFor({ gridSize: 0 })).toEqual(["gridSize"]);
      expect(_invalidNamesFor({ gridSize: 1000.5 })).toEqual(["gridSize"]);
    });

    it("sparsity must be strictly positive but may be fractional", () => {
      expect(_invalidNamesFor({ sparsity: 0.01 })).toEqual([]);
      expect(_invalidNamesFor({ sparsity: 0 })).toEqual(["sparsity"]);
      expect(_invalidNamesFor({ sparsity: -0.5 })).toEqual(["sparsity"]);
    });

    it("dampening factor must be in (0, 1]", () => {
      expect(_invalidNamesFor({ dampeningFactor: 1 })).toEqual([]);
      expect(_invalidNamesFor({ dampeningFactor: 0.001 })).toEqual([]);
      expect(_invalidNamesFor({ dampeningFactor: 0 })).toEqual(["dampeningFactor"]);
      expect(_invalidNamesFor({ dampeningFactor: 1.01 })).toEqual(["dampeningFactor"]);
    });

    it("strengthening factor must be at least 1", () => {
      expect(_invalidNamesFor({ strengtheningFactor: 1 })).toEqual([]);
      expect(_invalidNamesFor({ strengtheningFactor: 0.99 })).toEqual(["strengtheningFactor"]);
    });

    it("edge pacing must be a positive integer", () => {
      expect(_invalidNamesFor({ edgePacingMilliseconds: 1 })).toEqual([]);
      expect(_invalidNamesFor({ edgePacingMilliseconds: 0 })).toEqual(["edgePacingMilliseconds"]);
      expect(_invalidNamesFor({ edgePacingMilliseconds: 12.5 })).toEqual(["edgePacingMilliseconds"]);
    });

    it("screen margin must be in [0, 0.5)", () => {
      expect(_invalidNamesFor({ screenMarginFraction: 0 })).toEqual([]);
      expect(_invalidNamesFor({ screenMarginFraction: 0.49 })).toEqual([]);
      expect(_invalidNamesFor({ screenMarginFraction: 0.5 })).toEqual(["screenMarginFraction"]);
      expect(_invalidNamesFor({ screenMarginFraction: -0.01 })).toEqual(["screenMarginFraction"]);
    });

    it("special-subset size must be an integer, zero allowed", () => {
      expect(_invalidNamesFor({ specialSubsetSize: 0 })).toEqual([]);
      expect(_invalidNamesFor({ specialSubsetSize: -1 })).toEqual(["specialSubsetSize"]);
      expect(_invalidNamesFor({ specialSubsetSize: 2.5 })).toEqual(["specialSubsetSize"]);
    });

    it("vertex count must be a positive integer", () => {
      expect(_invalidNamesFor({ vertexCount: 0 })).toEqual(
        expect.arrayContaining(["vertexCount"]),
      );
      expect(_invalidNamesFor({ vertexCount: 10.5 })).toEqual(
        expect.arrayContaining(["vertexCount"]),
      );
    });
  });

  describe("TestCrossFieldBounds (AC7, FR12)", () => {
    it("vertex count may equal (gridSize + 1)^2 but not exceed it", () => {
      expect(_invalidNamesFor({ vertexCount: 9, gridSize: 2 })).toEqual([]);
      expect(_invalidNamesFor({ vertexCount: 10, gridSize: 2 })).toEqual(["vertexCount"]);
    });

    it("is measured against the staged grid size: shrinking it can invalidate an unchanged vertex count", () => {
      expect(_invalidNamesFor({ vertexCount: 400, gridSize: 19 })).toEqual([]);
      expect(_invalidNamesFor({ vertexCount: 400, gridSize: 18 })).toEqual(["vertexCount"]);
    });

    it("special-subset size may equal the vertex count but not exceed it", () => {
      expect(_invalidNamesFor({ vertexCount: 10, specialSubsetSize: 10 })).toEqual([]);
      expect(_invalidNamesFor({ vertexCount: 10, specialSubsetSize: 11 })).toEqual([
        "specialSubsetSize",
      ]);
    });

    it("nearest-neighbor count must be between 1 and vertexCount - 1", () => {
      expect(_invalidNamesFor({ vertexCount: 10, nearestNeighborCount: 9 })).toEqual([]);
      expect(_invalidNamesFor({ vertexCount: 10, nearestNeighborCount: 1 })).toEqual([]);
      expect(_invalidNamesFor({ vertexCount: 10, nearestNeighborCount: 10 })).toEqual([
        "nearestNeighborCount",
      ]);
      expect(_invalidNamesFor({ nearestNeighborCount: 0 })).toEqual(["nearestNeighborCount"]);
      expect(_invalidNamesFor({ nearestNeighborCount: 2.5 })).toEqual(["nearestNeighborCount"]);
    });

    it("is measured against the staged vertex count: shrinking it invalidates unchanged dependents", () => {
      expect(_invalidNamesFor({ vertexCount: 3 })).toEqual([
        "nearestNeighborCount",
        "specialSubsetSize",
      ]);
    });
  });
});
