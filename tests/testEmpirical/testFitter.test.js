/**
 * empirical/fitter.js: fitSigmoid(dataPoints) -> [kFit, r0]
 * hand-rolled sigmoid fit, minimizes squared-error loss
 */
import { describe, expect, it } from "vitest";

import { fitSigmoid } from "../../empirical/fitter.js";

function sigmoid(r, k, r0) {
  return 1.0 / (1.0 + Math.exp(-k * (r - r0)));
}

function sumSquaredLoss(dataPoints, k, r0) {
  let total = 0;
  for (const [r, proportion] of dataPoints) {
    const diff = sigmoid(r, k, r0) - proportion;
    total += diff * diff;
  }
  return total;
}

function linspace(start, stop, steps) {
  if (steps === 1) return [start];
  const step = (stop - start) / (steps - 1);
  return Array.from({ length: steps }, (_, i) => start + i * step);
}

// Small deterministic LCG-based pseudo-random generator.
function makeDeterministicNoiseGenerator(seed) {
  let state = seed >>> 0;
  return function nextUniform(low, high) {
    // Numerical Recipes LCG constants.
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const fraction = state / 0xffffffff;
    return low + fraction * (high - low);
  };
}

describe("fitter", () => {
  describe("TestTerminatesAndReturnsAPairOfFloats", () => {
    it("returns a finite kFit, r0 pair for arbitrary nonempty data", () => {
      const dataPoints = [
        [0.0, 0.1],
        [1.0, 0.5],
        [2.0, 0.9],
      ];
      const [kFit, r0] = fitSigmoid(dataPoints);
      expect(typeof kFit).toBe("number");
      expect(typeof r0).toBe("number");
      expect(Number.isFinite(kFit)).toBe(true);
      expect(Number.isFinite(r0)).toBe(true);
    });

    it("terminates on a single data point", () => {
      const dataPoints = [[3.0, 0.5]];
      const [kFit, r0] = fitSigmoid(dataPoints);
      expect(Number.isFinite(kFit)).toBe(true);
      expect(Number.isFinite(r0)).toBe(true);
    });
  });

  describe("TestRecoversGroundTruthR0FromNoisySyntheticData", () => {
    it("fitted r0 is within ten percent of the range span of the true r0", () => {
      const trueR0 = 2.0;
      const trueK = 3.0;
      const rValues = linspace(0.0, 4.0, 21);
      const nextUniform = makeDeterministicNoiseGenerator(20260917);
      const dataPoints = rValues.map((r) => {
        const trueP = sigmoid(r, trueK, trueR0);
        const noise = nextUniform(-0.02, 0.02);
        const noisyP = Math.min(1.0, Math.max(0.0, trueP + noise));
        return [r, noisyP];
      });

      const [, fittedR0] = fitSigmoid(dataPoints);

      const span = Math.max(...rValues) - Math.min(...rValues);
      const tolerance = 0.1 * span;
      expect(Math.abs(fittedR0 - trueR0)).toBeLessThanOrEqual(tolerance);
    });
  });

  describe("TestPurity", () => {
    it("same input list yields the same result every time", () => {
      const dataPoints = [
        [0.0, 0.1],
        [1.0, 0.4],
        [2.0, 0.6],
        [3.0, 0.9],
      ];
      const first = fitSigmoid(dataPoints);
      const second = fitSigmoid(dataPoints);
      expect(first).toEqual(second);
    });
  });

  describe("TestFitDoesNotWorsenLossRelativeToInitialGuess", () => {
    it("fitted loss is no worse than loss at the initial guess", () => {
      const dataPoints = [
        [0.0, 0.05],
        [1.0, 0.3],
        [2.0, 0.7],
        [3.0, 0.95],
      ];
      const rValuesOnly = dataPoints.map(([r]) => r);
      const initialR0 = (Math.min(...rValuesOnly) + Math.max(...rValuesOnly)) / 2.0;
      const initialK = 1.0;
      const initialLoss = sumSquaredLoss(dataPoints, initialK, initialR0);

      const [kFit, r0] = fitSigmoid(dataPoints);
      const fittedLoss = sumSquaredLoss(dataPoints, kFit, r0);

      expect(fittedLoss).toBeLessThanOrEqual(initialLoss + 1e-9);
    });
  });

  describe("TestDegenerateConstantData", () => {
    it("all proportions equal one still terminates with positive finite kFit", () => {
      const dataPoints = [
        [0.0, 1.0],
        [1.0, 1.0],
        [2.0, 1.0],
        [3.0, 1.0],
      ];
      const [kFit, r0] = fitSigmoid(dataPoints);
      expect(Number.isFinite(kFit)).toBe(true);
      expect(Number.isFinite(r0)).toBe(true);
    });
  });

  describe("TestFitRecoversVisibleTrendNotADegenerateTrap", () => {
    // Regression test.
    const dataPoints = [
      [0.2, 0.033],
      [0.4, 0.1],
      [0.6, 0.167],
      [0.8, 0.433],
      [1.0, 0.667],
      [1.2, 0.833],
      [1.5, 0.933],
      [2.0, 1.0],
    ];

    it("fitted r0 falls within the tested r range", () => {
      const [, r0] = fitSigmoid(dataPoints);
      const rValuesOnly = dataPoints.map(([r]) => r);
      expect(r0).toBeGreaterThanOrEqual(Math.min(...rValuesOnly));
      expect(r0).toBeLessThanOrEqual(Math.max(...rValuesOnly));
    });

    it("fitted kFit is not collapsed to near zero", () => {
      const [kFit] = fitSigmoid(dataPoints);
      expect(Math.abs(kFit)).toBeGreaterThan(0.1);
    });

    it("fitted loss is meaningfully small", () => {
      const [kFit, r0] = fitSigmoid(dataPoints);
      const loss = sumSquaredLoss(dataPoints, kFit, r0);
      expect(loss).toBeLessThan(0.5);
    });
  });
});
