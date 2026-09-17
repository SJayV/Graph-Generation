"""Tests for the trial-runner (User Story 2).

Assumed interface:
    trialRunner.runTrials(r, n, L, k, N, rng) -> float
        Runs N independent trials. Each trial: fresh sampleVertices(n, L, rng),
        fresh selectSpecialSubset(allVertices, k, rng), then
        algorithm.growEdges(allVertices, special, r, sigma=L/10). The trial's
        outcome is True iff every member of that trial's special subset
        resolves to the same DSU root afterwards (vacuously True for
        k in {0, 1}). Returns the proportion of the N outcomes that are True,
        a value in [0, 1]. The N trials share one caller-supplied
        random.Random instance, advanced sequentially. sigma is not a
        parameter of this function (fixed internally as L / 10, per A15/A33).
"""
import inspect
import math
import random

import pytest
import trialRunner
import vertices


def fullyConnectingR(n):
    """Smallest r for which m = floor(r * n) >= C(n, 2), i.e. a complete graph."""
    return math.comb(n, 2) / n


class TestReturnsExactlyBasedOnNTrials:
    def test_runTrials_reports_correct_proportion_when_all_outcomes_forced_true(self, rng):
        n, L, k, N = 6, 20, 0, 10
        proportion = trialRunner.runTrials(r=0.0, n=n, L=L, k=k, N=N, rng=rng)
        assert proportion == 1.0

    def test_runTrials_reports_correct_proportion_when_all_outcomes_forced_false(self, rng):
        n, L, k, N = 6, 20, 3, 7
        proportion = trialRunner.runTrials(r=0.0, n=n, L=L, k=k, N=N, rng=rng)
        assert proportion == 0.0

    def test_runTrials_invokes_vertex_sampling_exactly_N_times(self, monkeypatch, rng):
        n, L, k, N = 5, 15, 2, 6
        callCount = {"count": 0}
        originalSample = vertices.sampleVertices

        def countingSample(nArg, lArg, rngArg):
            callCount["count"] += 1
            return originalSample(nArg, lArg, rngArg)

        monkeypatch.setattr(vertices, "sampleVertices", countingSample)
        trialRunner.runTrials(r=1.0, n=n, L=L, k=k, N=N, rng=rng)
        assert callCount["count"] == N


class TestEachTrialDrawsFreshFromSharedAdvancingRng:
    def test_same_seeded_fresh_rng_reproduces_the_whole_run(self):
        n, L, k, N, r = 6, 20, 2, 8, 1.0
        firstProportion = trialRunner.runTrials(
            r=r, n=n, L=L, k=k, N=N, rng=random.Random(99)
        )
        secondProportion = trialRunner.runTrials(
            r=r, n=n, L=L, k=k, N=N, rng=random.Random(99)
        )
        assert firstProportion == secondProportion

    def test_vertex_sampling_calls_receive_different_rng_derived_values_across_trials(
        self, monkeypatch, rng
    ):
        n, L, k, N = 5, 15, 2, 6
        seenVertexSets = []
        originalSample = vertices.sampleVertices

        def recordingSample(nArg, lArg, rngArg):
            result = originalSample(nArg, lArg, rngArg)
            seenVertexSets.append(tuple(result))
            return result

        monkeypatch.setattr(vertices, "sampleVertices", recordingSample)
        trialRunner.runTrials(r=1.0, n=n, L=L, k=k, N=N, rng=rng)

        assert len(seenVertexSets) == N
        assert len(set(seenVertexSets)) > 1  # rng advanced, not reused identically


class TestOutcomeTrueIffSpecialSubsetSharesRoot:
    @pytest.mark.parametrize("k", [0, 1])
    def test_k_zero_or_one_is_vacuously_true_regardless_of_r(self, k, rng):
        n, L, N = 8, 25, 12
        proportion = trialRunner.runTrials(r=0.0, n=n, L=L, k=k, N=N, rng=rng)
        assert proportion == 1.0


class TestReturnValueIsAProportion:
    @pytest.mark.parametrize("r", [0.0, 0.5, 2.0, 100.0])
    def test_proportion_is_within_unit_interval(self, r, rng):
        n, L, k, N = 6, 20, 3, 10
        proportion = trialRunner.runTrials(r=r, n=n, L=L, k=k, N=N, rng=rng)
        assert 0.0 <= proportion <= 1.0


class TestPurity:
    def test_same_inputs_and_same_starting_rng_state_yield_same_proportion(self):
        n, L, k, N, r = 7, 18, 3, 15, 1.5
        first = trialRunner.runTrials(r=r, n=n, L=L, k=k, N=N, rng=random.Random(2024))
        second = trialRunner.runTrials(r=r, n=n, L=L, k=k, N=N, rng=random.Random(2024))
        assert first == second


class TestSigmaIsNotAParameter:
    def test_signature_has_no_sigma_parameter(self):
        signature = inspect.signature(trialRunner.runTrials)
        assert "sigma" not in signature.parameters


class TestFullyConnectingRForcesTrueOutcome:
    def test_r_that_completes_the_graph_yields_proportion_one(self, rng):
        n, L, k, N = 6, 20, 4, 10
        r = fullyConnectingR(n)
        proportion = trialRunner.runTrials(r=r, n=n, L=L, k=k, N=N, rng=rng)
        assert proportion == 1.0

    def test_oversized_r_yields_proportion_one_for_any_special_subset_size(self, rng):
        n, L, k, N = 5, 12, 5, 8
        r = 1_000_000.0
        proportion = trialRunner.runTrials(r=r, n=n, L=L, k=k, N=N, rng=rng)
        assert proportion == 1.0


class TestZeroRForcesFalseOutcome:
    @pytest.mark.parametrize("k", [2, 3, 5])
    def test_r_zero_with_at_least_two_special_members_yields_proportion_zero(self, k, rng):
        n, L, N = 8, 25, 10
        proportion = trialRunner.runTrials(r=0.0, n=n, L=L, k=k, N=N, rng=rng)
        assert proportion == 0.0