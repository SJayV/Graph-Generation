/** Sweeps the trial-runner across a list of r values and fits a sigmoid. */
import { fitSigmoid } from "./fitter.js";
import { runTrials } from "./trialRunner.js";

// PUBLIC INTERFACE

export function sweepAndFit(rValues, n, L, k, N, rngSource, fieldFactors) {
  const rawResults = rValues.map((r) => [r, runTrials(r, n, L, k, N, rngSource, fieldFactors)]);
  const [kFit, r0] = fitSigmoid(rawResults);
  return { rawResults, kFit, r0 };
}
