/**
 * empirical/orchestrator.js: sweepAndFit(rValues, n, L, k, N, rngSource)
 * -> { rawResults, kFit, r0 }; composes trialRunner + fitter
 */
import { describe, expect, it, vi } from "vitest";

import * as fitter from "../../empirical/fitter.js";
import * as orchestrator from "../../empirical/orchestrator.js";
import * as trialRunnerModule from "../../empirical/trialRunner.js";
import { createSeededRng } from "../../logic/rng.js";

function makeRng() {
  return createSeededRng(1234);
}

describe("orchestrator", () => {
  describe("TestRawResultsMatchInputRValues", () => {
    it("emits one pair per input r value in the same order", () => {
      const rValues = [0.0, 0.5, 1.0, 2.0];
      const scriptedProportions = [0.1, 0.3, 0.6, 0.9];
      let callIndex = 0;

      const spy = vi
        .spyOn(trialRunnerModule, "runTrials")
        .mockImplementation(() => scriptedProportions[callIndex++]);

      const result = orchestrator.sweepAndFit(rValues, 6, 20, 2, 5, makeRng());

      expect(result.rawResults.length).toBe(rValues.length);
      expect(result.rawResults.map(([r]) => r)).toEqual(rValues);

      spy.mockRestore();
    });

    it("skips or duplicates no r values for a longer sweep", () => {
      const rValues = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2];

      const spy = vi.spyOn(trialRunnerModule, "runTrials").mockImplementation(() => 0.5);

      const result = orchestrator.sweepAndFit(rValues, 6, 20, 2, 5, makeRng());

      expect(result.rawResults.map(([r]) => r)).toEqual(rValues);
      expect(result.rawResults.length).toBe(rValues.length);

      spy.mockRestore();
    });
  });

  describe("TestResultIncludesFittedParameters", () => {
    it("exposes kFit and r0", () => {
      const rValues = [0.0, 1.0, 2.0];

      const spy = vi
        .spyOn(trialRunnerModule, "runTrials")
        .mockImplementation((r) => r / 2.0);

      const result = orchestrator.sweepAndFit(rValues, 6, 20, 2, 5, makeRng());

      expect(typeof result.kFit).toBe("number");
      expect(typeof result.r0).toBe("number");

      spy.mockRestore();
    });
  });

  describe("TestWholeSweepDeterminism", () => {
    it("identical seeded rng and same r list reproduce the whole sweep", () => {
      const rValues = [0.0, 0.5, 1.0, 1.5, 2.0];
      const n = 6;
      const L = 20;
      const k = 2;
      const N = 8;

      const firstResult = orchestrator.sweepAndFit(rValues, n, L, k, N, createSeededRng(555));
      const secondResult = orchestrator.sweepAndFit(rValues, n, L, k, N, createSeededRng(555));

      expect(firstResult.rawResults).toEqual(secondResult.rawResults);
      expect(firstResult.kFit).toBe(secondResult.kFit);
      expect(firstResult.r0).toBe(secondResult.r0);
    });
  });

  describe("TestOrchestratorComposesTrialRunnerAndFitterWithoutSeparateFitLogic", () => {
    it("fitting the raw results manually reproduces the orchestrator's own fit", () => {
      const rValues = [0.0, 0.5, 1.0, 1.5, 2.0];
      const n = 6;
      const L = 20;
      const k = 2;
      const N = 10;

      const result = orchestrator.sweepAndFit(rValues, n, L, k, N, createSeededRng(777));

      const [recomputedKFit, recomputedR0] = fitter.fitSigmoid(result.rawResults);

      expect(result.kFit).toBe(recomputedKFit);
      expect(result.r0).toBe(recomputedR0);
    });
  });
});
