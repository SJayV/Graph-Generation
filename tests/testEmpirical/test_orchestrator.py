"""Tests for the sweep-and-fit orchestrator (User Story 2).

Assumed interface:
    orchestrator.sweepAndFit(rValues, n, L, k, N, rng) -> SweepResult
        Calls trialRunner.runTrials(r, n, L, k, N, rng) once per r in
        rValues (in order given), sharing and sequentially advancing
        one rng across the whole sweep, then calls
        fitter.fitSigmoid(rawResults) on the collected data.

        SweepResult.rawResults: list[tuple[float, float]]
            One (r, proportion) pair per input r value, in the same
            order as rValues.
        SweepResult.kFit: float
        SweepResult.r0: float
            The (kFit, r0) obtained by fitting rawResults.

    Determinism holds for the sweep as a whole (same rValues order,
    same starting rng state), not for an individual r reproduced in
    isolation outside that context (A45).
"""
import random

import fitter
import orchestrator
import trialRunner


class TestRawResultsMatchInputRValues:
    def test_one_pair_per_input_r_value_in_the_same_order(self, monkeypatch, rng):
        rValues = [0.0, 0.5, 1.0, 2.0]
        scriptedProportions = iter([0.1, 0.3, 0.6, 0.9])

        def fakeRunTrials(r, n, L, k, N, rng):
            return next(scriptedProportions)

        monkeypatch.setattr(trialRunner, "runTrials", fakeRunTrials)

        result = orchestrator.sweepAndFit(
            rValues=rValues, n=6, L=20, k=2, N=5, rng=rng
        )

        assert len(result.rawResults) == len(rValues)
        assert [r for r, _ in result.rawResults] == rValues

    def test_no_r_values_skipped_or_duplicated_for_a_longer_sweep(self, monkeypatch, rng):
        rValues = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]
        monkeypatch.setattr(
            trialRunner, "runTrials", lambda r, n, L, k, N, rng: 0.5
        )

        result = orchestrator.sweepAndFit(
            rValues=rValues, n=6, L=20, k=2, N=5, rng=rng
        )

        assert [r for r, _ in result.rawResults] == rValues
        assert len(result.rawResults) == len(rValues)


class TestResultIncludesFittedParameters:
    def test_result_exposes_kFit_and_r0(self, monkeypatch, rng):
        rValues = [0.0, 1.0, 2.0]
        monkeypatch.setattr(
            trialRunner, "runTrials", lambda r, n, L, k, N, rng: r / 2.0
        )

        result = orchestrator.sweepAndFit(
            rValues=rValues, n=6, L=20, k=2, N=5, rng=rng
        )

        assert isinstance(result.kFit, float)
        assert isinstance(result.r0, float)


class TestWholeSweepDeterminism:
    def test_identical_seeded_rng_and_same_r_list_reproduce_the_whole_sweep(self):
        rValues = [0.0, 0.5, 1.0, 1.5, 2.0]
        n, L, k, N = 6, 20, 2, 8

        firstResult = orchestrator.sweepAndFit(
            rValues=rValues, n=n, L=L, k=k, N=N, rng=random.Random(555)
        )
        secondResult = orchestrator.sweepAndFit(
            rValues=rValues, n=n, L=L, k=k, N=N, rng=random.Random(555)
        )

        assert firstResult.rawResults == secondResult.rawResults
        assert firstResult.kFit == secondResult.kFit
        assert firstResult.r0 == secondResult.r0


class TestOrchestratorComposesTrialRunnerAndFitterWithoutSeparateFitLogic:
    def test_fitting_the_raw_results_manually_reproduces_the_orchestrators_own_fit(self):
        rValues = [0.0, 0.5, 1.0, 1.5, 2.0]
        n, L, k, N = 6, 20, 2, 10

        result = orchestrator.sweepAndFit(
            rValues=rValues, n=n, L=L, k=k, N=N, rng=random.Random(777)
        )

        recomputedKFit, recomputedR0 = fitter.fitSigmoid(result.rawResults)

        assert result.kFit == recomputedKFit
        assert result.r0 == recomputedR0
