/**
 * empirical/trialRunner.js: runTrials(r, n, L, k, N, rngSource) -> number
 * proportion of N trials where special subset shares a DSU root
 */
import { describe, expect, it, vi } from "vitest";

import { runTrials } from "../../empirical/trialRunner.js";
import { createSeededRng } from "../../logic/rng.js";
import * as verticesModule from "../../logic/vertices.js";

function makeRng() {
  return createSeededRng(1234);
}

/** Smallest r for which m = floor(r * n) >= C(n, 2), i.e. a complete graph. */
function fullyConnectingR(n) {
  return (n * (n - 1)) / 2 / n;
}

describe("trialRunner", () => {
  describe("TestReturnsExactlyBasedOnNTrials", () => {
    it("reports correct proportion when all outcomes forced true", () => {
      const n = 6;
      const L = 20;
      const k = 0;
      const N = 10;
      const proportion = runTrials(0.0, n, L, k, N, makeRng());
      expect(proportion).toBe(1.0);
    });

    it("reports correct proportion when all outcomes forced false", () => {
      const n = 6;
      const L = 20;
      const k = 3;
      const N = 7;
      const proportion = runTrials(0.0, n, L, k, N, makeRng());
      expect(proportion).toBe(0.0);
    });

    it("invokes vertex sampling exactly N times", () => {
      const n = 5;
      const L = 15;
      const k = 2;
      const N = 6;
      let callCount = 0;
      const originalSample = verticesModule.sampleVertices;

      const spy = vi
        .spyOn(verticesModule, "sampleVertices")
        .mockImplementation((nArg, lArg, rngArg) => {
          callCount += 1;
          return originalSample(nArg, lArg, rngArg);
        });

      runTrials(1.0, n, L, k, N, makeRng());
      expect(callCount).toBe(N);

      spy.mockRestore();
    });
  });

  describe("TestEachTrialDrawsFreshFromSharedAdvancingRng", () => {
    it("same seeded fresh rng reproduces the whole run", () => {
      const n = 6;
      const L = 20;
      const k = 2;
      const N = 8;
      const r = 1.0;
      const firstProportion = runTrials(r, n, L, k, N, createSeededRng(99));
      const secondProportion = runTrials(r, n, L, k, N, createSeededRng(99));
      expect(firstProportion).toBe(secondProportion);
    });

    it("vertex sampling calls receive different rng-derived values across trials", () => {
      const n = 5;
      const L = 15;
      const k = 2;
      const N = 6;
      const seenVertexSets = [];
      const originalSample = verticesModule.sampleVertices;

      const spy = vi
        .spyOn(verticesModule, "sampleVertices")
        .mockImplementation((nArg, lArg, rngArg) => {
          const result = originalSample(nArg, lArg, rngArg);
          seenVertexSets.push(JSON.stringify(result));
          return result;
        });

      runTrials(1.0, n, L, k, N, makeRng());

      expect(seenVertexSets.length).toBe(N);
      expect(new Set(seenVertexSets).size).toBeGreaterThan(1); // rng advanced, not reused identically

      spy.mockRestore();
    });
  });

  describe("TestOutcomeTrueIffSpecialSubsetSharesRoot", () => {
    it.each([0, 1])("k=%i is vacuously true regardless of r", (k) => {
      const n = 8;
      const L = 25;
      const N = 12;
      const proportion = runTrials(0.0, n, L, k, N, makeRng());
      expect(proportion).toBe(1.0);
    });
  });

  describe("TestReturnValueIsAProportion", () => {
    it.each([0.0, 0.5, 2.0, 100.0])("proportion is within unit interval for r=%f", (r) => {
      const n = 6;
      const L = 20;
      const k = 3;
      const N = 10;
      const proportion = runTrials(r, n, L, k, N, makeRng());
      expect(proportion).toBeGreaterThanOrEqual(0.0);
      expect(proportion).toBeLessThanOrEqual(1.0);
    });
  });

  describe("TestPurity", () => {
    it("same inputs and same starting rng state yield same proportion", () => {
      const n = 7;
      const L = 18;
      const k = 3;
      const N = 15;
      const r = 1.5;
      const first = runTrials(r, n, L, k, N, createSeededRng(2024));
      const second = runTrials(r, n, L, k, N, createSeededRng(2024));
      expect(first).toBe(second);
    });
  });

  describe("TestSigmaIsNotAParameter", () => {
    it("declared signature has exactly the 6 non-sigma parameters", () => {
      // runTrials(r, n, L, k, N, rngSource) - 6 declared parameters, no sigma.
      expect(runTrials.length).toBe(6);
    });
  });

  describe("TestFullyConnectingRForcesTrueOutcome", () => {
    it("r that completes the graph yields proportion one", () => {
      const n = 6;
      const L = 20;
      const k = 4;
      const N = 10;
      const r = fullyConnectingR(n);
      const proportion = runTrials(r, n, L, k, N, makeRng());
      expect(proportion).toBe(1.0);
    });

    it("oversized r yields proportion one for any special subset size", () => {
      const n = 5;
      const L = 12;
      const k = 5;
      const N = 8;
      const r = 1_000_000.0;
      const proportion = runTrials(r, n, L, k, N, makeRng());
      expect(proportion).toBe(1.0);
    });
  });

  describe("TestZeroRForcesFalseOutcome", () => {
    it.each([2, 3, 5])("r=0 with k=%i special members yields proportion zero", (k) => {
      const n = 8;
      const L = 25;
      const N = 10;
      const proportion = runTrials(0.0, n, L, k, N, makeRng());
      expect(proportion).toBe(0.0);
    });
  });
});
