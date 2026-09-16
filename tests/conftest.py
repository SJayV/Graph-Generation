"""Shared pytest fixtures.

Assumed interface under test (short form; each test file repeats the
part relevant to it):
- vertices.sampleVertices(n, L, rng) -> list[tuple[int, int]]
- vertices.selectSpecialSubset(allVertices, k, rng) -> list[tuple[int, int]]
- dsu.DSU(allVertices, specialSubset) with .find(v), .union(a, b),
  .sCount(root), .componentCount()
- field.gaussian(x, mu, sigma), field.fieldValue(dsu, vertex, x, sigma)
  (a single Gaussian bump centred on `vertex`'s own fixed position,
  scaled by sqrt(|C(find(vertex))|)), field.key(dsu, u, v, sigma)
  (p0 + fieldValue(dsu, v, u, sigma) + fieldValue(dsu, u, v, sigma), a
  sum, not a max)
- algorithm.candidatePairs(allVertices) -> set[frozenset]
- algorithm.growEdges(allVertices, specialSubset, r, sigma, rng=None)
  -> object with .edges (set[frozenset]) and .dsu (DSU)
- algorithm.growEdgesStepwise(allVertices, specialSubset, r, sigma, rng=None)
  -> iterator of accepted edges in acceptance order

Fixtures build fresh objects per test (function scope), so no mutable
state is shared across tests.
"""
import random

import pytest


@pytest.fixture
def rng():
    """A fresh, deterministically seeded RNG, isolated per test."""
    return random.Random(1234)