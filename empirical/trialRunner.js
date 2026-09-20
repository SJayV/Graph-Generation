/** Repeated trials of the edge-growth algorithm. */
import * as algorithm from "../logic/algorithm.js";
import { sigmaFromGridSize } from "../logic/field.js";
import * as verticesModule from "../logic/vertices.js";

// HELPER FUNCTIONS

function _trialOutcome(r, n, L, k, rngSource) {
  const allVertices = verticesModule.sampleVertices(n, L, rngSource);
  const specialSubset = verticesModule.selectSpecialSubset(allVertices, k, rngSource);
  const sigma = sigmaFromGridSize(L);
  const { dsu } = algorithm.growEdges(allVertices, specialSubset, r, sigma);

  if (specialSubset.length <= 1) {
    return true;
  }

  const roots = new Set(specialSubset.map((vertex) => verticesModule.vertexKey(dsu.find(vertex))));
  return roots.size === 1;
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
