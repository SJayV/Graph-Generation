/** Repeated trials of the edge-growth algorithm. */
import { growEdgesStepwise as growGenerationStepwise } from "../algorithms/parametrization/generation.js";
import { drainEdges } from "../algorithms/skeleton/greedyAlgorithm.js";
import { sigma as computeSigma } from "../logic/computation/field.js";
import { sampleVertices, selectSpecialSubset } from "../logic/construction/vertices.js";

// HELPER FUNCTIONS

function _trialOutcome(r, n, L, k, rngSource, fieldFactors) {
  const allVertices = sampleVertices(n, L, rngSource);
  const specialSubset = selectSpecialSubset(allVertices, k, rngSource);
  const fieldShape = { sigma: computeSigma(n, L), ...fieldFactors };
  const { dsu } = drainEdges(growGenerationStepwise(allVertices, specialSubset, r, fieldShape));

  return dsu.allConnected(specialSubset);
}

// PUBLIC INTERFACE

/** Runs N independent trials. */
export function runTrials(r, n, L, k, N, rngSource, fieldFactors) {
  let trueOutcomeCount = 0;
  for (let i = 0; i < N; i += 1) {
    if (_trialOutcome(r, n, L, k, rngSource, fieldFactors)) {
      trueOutcomeCount += 1;
    }
  }
  return trueOutcomeCount / N;
}
