/**
 * composes trialRunner + fitter into a single sweep-and-fit pipeline
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { fitSigmoid } from "../../empirical/fitter.js";
import { sweepAndFit } from "../../empirical/orchestrator.js";
import { runTrials } from "../../empirical/trialRunner.js";
import { createSeededRng } from "../../logic/construction/rng.js";

// runTrials delegates to the real implementation unless a test overrides it.
vi.mock("../../empirical/trialRunner.js", async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, runTrials: vi.fn(original.runTrials) };
});

const { runTrials: originalRunTrials } = await vi.importActual("../../empirical/trialRunner.js");

afterEach(() => {
  vi.mocked(runTrials).mockReset();
  vi.mocked(runTrials).mockImplementation(originalRunTrials);
});

const FIELD_FACTORS = { dampeningFactor: 0.1, strengtheningFactor: 10 };

function makeRng() {
  return createSeededRng(1234);
}

describe("orchestrator", () => {
  describe("TestRawResultsMatchInputRValues", () => {
    it("emits one pair per input r value in the same order", () => {
      const rValues = [0.0, 0.5, 1.0, 2.0];
      const scriptedProportions = [0.1, 0.3, 0.6, 0.9];
      let callIndex = 0;

      vi.mocked(runTrials).mockImplementation(() => scriptedProportions[callIndex++]);

      const result = sweepAndFit(rValues, 6, 20, 2, 5, makeRng(), FIELD_FACTORS);

      expect(result.rawResults.length).toBe(rValues.length);
      expect(result.rawResults.map(([r]) => r)).toEqual(rValues);
    });

    it("skips or duplicates no r values for a longer sweep", () => {
      const rValues = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2];

      vi.mocked(runTrials).mockImplementation(() => 0.5);

      const result = sweepAndFit(rValues, 6, 20, 2, 5, makeRng(), FIELD_FACTORS);

      expect(result.rawResults.map(([r]) => r)).toEqual(rValues);
      expect(result.rawResults.length).toBe(rValues.length);
    });
  });

  describe("TestResultIncludesFittedParameters", () => {
    it("exposes kFit and r0", () => {
      const rValues = [0.0, 1.0, 2.0];

      vi.mocked(runTrials).mockImplementation((r) => r / 2.0);

      const result = sweepAndFit(rValues, 6, 20, 2, 5, makeRng(), FIELD_FACTORS);

      expect(typeof result.kFit).toBe("number");
      expect(typeof result.r0).toBe("number");
    });
  });

  describe("TestWholeSweepDeterminism", () => {
    it("identical seeded rng and same r list reproduce the whole sweep", () => {
      const rValues = [0.0, 0.5, 1.0, 1.5, 2.0];
      const n = 6;
      const L = 20;
      const k = 2;
      const N = 8;

      const firstResult = sweepAndFit(rValues, n, L, k, N, createSeededRng(555), FIELD_FACTORS);
      const secondResult = sweepAndFit(rValues, n, L, k, N, createSeededRng(555), FIELD_FACTORS);

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

      const result = sweepAndFit(rValues, n, L, k, N, createSeededRng(777), FIELD_FACTORS);

      const [recomputedKFit, recomputedR0] = fitSigmoid(result.rawResults);

      expect(result.kFit).toBe(recomputedKFit);
      expect(result.r0).toBe(recomputedR0);
    });
  });
});
