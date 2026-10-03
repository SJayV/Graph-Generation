/** Wraps a general shortest-path stepwise generator's initialSources parameter into fixed seeding strategies. */

// PUBLIC INTERFACE

export function createDirectionalVariants(generalGrowEdgesStepwise) {
  return {
    growEdgesUnidirectionalStepwise: (allVertices, specialSubset, heuristicFunction, edgeSet) =>
      generalGrowEdgesStepwise(allVertices, specialSubset, undefined, heuristicFunction, edgeSet),
    growEdgesMultidirectionalStepwise: (allVertices, specialSubset, heuristicFunction, edgeSet) =>
      generalGrowEdgesStepwise(allVertices, specialSubset, specialSubset, heuristicFunction, edgeSet),
  };
}
