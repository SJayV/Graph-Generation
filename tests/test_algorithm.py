"""Tests for the edge-selection algorithm.

Assumed interface:
    algorithm.candidatePairs(allVertices: list) -> set[frozenset]
        All unordered pairs {u, v} with u != v.
    algorithm.growEdges(allVertices, specialSubset, r, sigma, rng=None) -> GrowthResult
        GrowthResult.edges: set[frozenset]   # accepted edges
        GrowthResult.dsu: dsu.DSU            # final DSU state
        Terminates with len(edges) == min(floor(r * len(allVertices)), C(n, 2)).
    algorithm.growEdgesStepwise(allVertices, specialSubset, r, sigma, rng=None)
        -> Iterator[frozenset]
        Yields accepted edges one at a time, in acceptance order.

Note: the recomputation test below assumes the algorithm calls
`field.key(...)` via the module attribute (not a `from field import key`
binding), so that monkeypatching `field.key` can observe calls made
during the run. If the implementation binds the function locally at
import time, that one test will need adjusting to match.
"""
import math
import random

import algorithm


def makeVertices(n):
    return [(i, 0) for i in range(n)]


class TestCandidatePoolInitialization:
    def test_candidatePairs_has_size_n_choose_2(self):
        allVertices = makeVertices(6)
        pairs = algorithm.candidatePairs(allVertices)
        assert len(pairs) == math.comb(len(allVertices), 2)

    def test_candidatePairs_excludes_self_pairs(self):
        allVertices = makeVertices(5)
        pairs = algorithm.candidatePairs(allVertices)
        for pair in pairs:
            u, v = tuple(pair)
            assert u != v

    def test_candidatePairs_contains_only_unordered_pairs(self):
        allVertices = makeVertices(4)
        pairs = algorithm.candidatePairs(allVertices)
        for pair in pairs:
            assert len(pair) == 2


class TestAcceptedEdgesAreNeverReconsidered:
    def test_edge_set_grows_monotonically_with_no_repeated_emissions(self):
        allVertices = makeVertices(6)
        special = [allVertices[0], allVertices[1]]
        sigma = 1.0

        emittedSoFar = set()
        for edge in algorithm.growEdgesStepwise(
            allVertices, special, r=1.5, sigma=sigma, rng=random.Random(3)
        ):
            assert edge not in emittedSoFar
            emittedSoFar.add(edge)

    def test_stepwise_emissions_are_a_subset_of_the_final_edge_set(self):
        allVertices = makeVertices(6)
        special = [allVertices[0], allVertices[1]]
        sigma = 1.0

        emittedSoFar = set(
            algorithm.growEdgesStepwise(
                allVertices, special, r=1.5, sigma=sigma, rng=random.Random(3)
            )
        )
        result = algorithm.growEdges(
            allVertices, special, r=1.5, sigma=sigma, rng=random.Random(3)
        )
        assert emittedSoFar.issubset(result.edges)


class TestTermination:
    def test_edge_count_equals_m_when_m_is_below_the_maximum(self):
        allVertices = makeVertices(8)
        special = allVertices[:3]
        sigma = 1.0
        n = len(allVertices)
        r = 1.0
        m = math.floor(r * n)
        maxEdges = math.comb(n, 2)
        assert m < maxEdges  # sanity check on the chosen scenario

        result = algorithm.growEdges(
            allVertices, special, r=r, sigma=sigma, rng=random.Random(11)
        )
        assert len(result.edges) == min(m, maxEdges)

    def test_edge_count_caps_at_n_choose_2_when_r_implies_more_edges_than_possible(self):
        allVertices = makeVertices(5)
        special = allVertices[:2]
        sigma = 1.0
        n = len(allVertices)
        r = 1000.0
        m = math.floor(r * n)
        maxEdges = math.comb(n, 2)
        assert m > maxEdges  # sanity check: r is deliberately oversized

        result = algorithm.growEdges(
            allVertices, special, r=r, sigma=sigma, rng=random.Random(11)
        )
        assert len(result.edges) == maxEdges

    def test_oversized_r_still_terminates(self):
        allVertices = makeVertices(6)
        special = allVertices[:2]
        sigma = 1.0

        # Regression guard: this call must return rather than hang.
        result = algorithm.growEdges(
            allVertices, special, r=1_000_000.0, sigma=sigma, rng=random.Random(5)
        )
        assert len(result.edges) == math.comb(len(allVertices), 2)


class TestNoSelfLoopsOrDuplicates:
    def test_no_self_loop_edges_present(self):
        allVertices = makeVertices(6)
        special = allVertices[:2]
        result = algorithm.growEdges(
            allVertices, special, r=2.0, sigma=1.0, rng=random.Random(9)
        )
        for edge in result.edges:
            u, v = tuple(edge)
            assert u != v

    def test_no_duplicate_unordered_pairs(self):
        allVertices = makeVertices(6)
        special = allVertices[:2]
        result = algorithm.growEdges(
            allVertices, special, r=2.0, sigma=1.0, rng=random.Random(9)
        )
        assert len(result.edges) == len(set(result.edges))


class TestKeyRecomputationBeforeAcceptance:
    def test_key_is_recomputed_at_least_once_per_run(self, monkeypatch):
        import field

        allVertices = makeVertices(6)
        special = allVertices[:2]
        sigma = 1.0
        callLog = []
        originalKey = field.key

        def spyKey(structure, u, v, sig):
            value = originalKey(structure, u, v, sig)
            callLog.append((u, v, structure.find(u), structure.find(v), value))
            return value

        monkeypatch.setattr(field, "key", spyKey)
        algorithm.growEdges(
            allVertices, special, r=2.0, sigma=sigma, rng=random.Random(9)
        )

        # An algorithm that never (re)computes field.key would trivially
        # fail this guard; it does not by itself prove staleness handling,
        # only that recomputation is observably wired in.
        assert len(callLog) > 0