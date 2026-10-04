/** Repeated trials of the edge-growth algorithm. */
import * as algorithm from "../algorithms/parametrization/generation.js";
import { drainEdges } from "../algorithms/skeleton/greedyAlgorithm.js";
import { sigma as computeSigma } from "../parameters.js";
import * as verticesModule from "../logic/randomness/vertices.js";

// HELPER FUNCTIONS

function _trialOutcome(r, n, L, k, rngSource) {
  const allVertices = verticesModule.sampleVertices(n, L, rngSource);
  const specialSubset = verticesModule.selectSpecialSubset(allVertices, k, rngSource);
  const sigma = computeSigma(n, L);
  const { dsu } = drainEdges(algorithm.growEdgesStepwise(allVertices, specialSubset, r, sigma));

  return dsu.allConnected(specialSubset);
}

// PUBLIC INTERFACE

/** Runs N independent trials. */
export function runTrials(r, n, L, k, N, rngSource) {
  let trueOutcomeCount = 0;
  for (let i = 0; i < N; i += 1) {
    if (_trialOutcome(r, n, L, k, rngSource)) {
      trueOutcomeCount += 1;
    }
  }
  return trueOutcomeCount / N;
}
