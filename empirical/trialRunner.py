"""Repeated trials of the edge-growth algorithm, reporting how often the
special subset ends up sharing a single DSU root.
"""
import random

import algorithm
import vertices

SIGMA_DIVISOR = 10.0


def _trialOutcome(r: float, n: int, L: int, k: int, rng: random.Random) -> bool:
    allVertices = vertices.sampleVertices(n, L, rng)
    specialSubset = vertices.selectSpecialSubset(allVertices, k, rng)
    sigma = L / SIGMA_DIVISOR
    growthResult = algorithm.growEdges(allVertices, specialSubset, r, sigma)

    if len(specialSubset) <= 1:
        return True

    roots = {growthResult.dsu.find(vertex) for vertex in specialSubset}
    return len(roots) == 1


def runTrials(r: float, n: int, L: int, k: int, N: int, rng: random.Random) -> float:
    """Run N independent trials and return the proportion in which every
    member of a freshly-sampled size-k special subset shares a DSU root.
    """
    trueOutcomeCount = sum(_trialOutcome(r, n, L, k, rng) for _ in range(N))
    return trueOutcomeCount / N
