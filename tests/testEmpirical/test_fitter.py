"""Tests for the hand-rolled sigmoid fit (User Story 2).

Assumed interface:
    fitter.fitSigmoid(dataPoints: list[tuple[float, float]]) -> tuple[float, float]
        Given a non-empty list of (r, proportion) pairs, returns (kFit, r0)
        for p(r) = 1 / (1 + exp(-kFit * (r - r0))), obtained via a
        hand-rolled minimization of the squared-error loss
        L(k, r0) = sum((p(r_i; k, r0) - proportion_i) ** 2), starting
        from r0 = midpoint of the r-values in dataPoints and k = 1.0,
        iterating until convergence or an iteration cap is hit. kFit is
        unconstrained in sign (it may be positive, negative, or ~0) and the
        function always terminates and returns a finite pair, even on
        degenerate/non-converging data.
"""
import math
import random

import fitter


def sigmoid(r, k, r0):
    return 1.0 / (1.0 + math.exp(-k * (r - r0)))


def sumSquaredLoss(dataPoints, k, r0):
    return sum((sigmoid(r, k, r0) - proportion) ** 2 for r, proportion in dataPoints)


def linspace(start, stop, steps):
    if steps == 1:
        return [start]
    step = (stop - start) / (steps - 1)
    return [start + i * step for i in range(steps)]


class TestTerminatesAndReturnsAPairOfFloats:
    def test_returns_a_finite_kFit_r0_pair_for_arbitrary_nonempty_data(self):
        dataPoints = [(0.0, 0.1), (1.0, 0.5), (2.0, 0.9)]
        kFit, r0 = fitter.fitSigmoid(dataPoints)
        assert isinstance(kFit, float)
        assert isinstance(r0, float)
        assert math.isfinite(kFit)
        assert math.isfinite(r0)

    def test_terminates_on_a_single_data_point(self):
        dataPoints = [(3.0, 0.5)]
        kFit, r0 = fitter.fitSigmoid(dataPoints)
        assert math.isfinite(kFit)
        assert math.isfinite(r0)


class TestRecoversGroundTruthR0FromNoisySyntheticData:
    def test_fitted_r0_within_ten_percent_of_range_span_of_true_r0(self):
        trueR0 = 2.0
        trueK = 3.0
        rValues = linspace(0.0, 4.0, 21)
        noiseRng = random.Random(20260917)
        dataPoints = []
        for r in rValues:
            trueP = sigmoid(r, trueK, trueR0)
            noise = noiseRng.uniform(-0.02, 0.02)
            noisyP = min(1.0, max(0.0, trueP + noise))
            dataPoints.append((r, noisyP))

        _, fittedR0 = fitter.fitSigmoid(dataPoints)

        span = max(rValues) - min(rValues)
        tolerance = 0.1 * span
        assert abs(fittedR0 - trueR0) <= tolerance


class TestPurity:
    def test_same_input_list_yields_the_same_result_every_time(self):
        dataPoints = [(0.0, 0.1), (1.0, 0.4), (2.0, 0.6), (3.0, 0.9)]
        first = fitter.fitSigmoid(dataPoints)
        second = fitter.fitSigmoid(dataPoints)
        assert first == second


class TestFitDoesNotWorsenLossRelativeToInitialGuess:
    def test_fitted_loss_is_no_worse_than_loss_at_the_initial_guess(self):
        dataPoints = [(0.0, 0.05), (1.0, 0.3), (2.0, 0.7), (3.0, 0.95)]
        rValuesOnly = [r for r, _ in dataPoints]
        initialR0 = (min(rValuesOnly) + max(rValuesOnly)) / 2.0
        initialK = 1.0
        initialLoss = sumSquaredLoss(dataPoints, initialK, initialR0)

        kFit, r0 = fitter.fitSigmoid(dataPoints)
        fittedLoss = sumSquaredLoss(dataPoints, kFit, r0)

        assert fittedLoss <= initialLoss + 1e-9


class TestDegenerateConstantData:
    def test_all_proportions_equal_one_still_terminates_with_positive_finite_kFit(self):
        dataPoints = [(0.0, 1.0), (1.0, 1.0), (2.0, 1.0), (3.0, 1.0)]
        kFit, r0 = fitter.fitSigmoid(dataPoints)
        assert math.isfinite(kFit)
        assert math.isfinite(r0)


class TestFitRecoversVisibleTrendNotADegenerateTrap:
    """Regression test for a real bug found by running the full study.

    This data set was produced by an actual study run (not synthetic noise
    generated for testing) and shows a clearly visible sigmoid-shaped rise
    from ~0.03 at r=0.2 up to 1.0 at r=2.0. The current Newton-Raphson
    fitter collapses to a near-flat fit (kFit approximately 0) centered far
    outside the tested r-range (r0 approx 10.3, well beyond the max tested
    r of 2.0), which is a degenerate local trap, not a reasonable fit to
    this data.
    """

    dataPoints = [
        (0.2, 0.033), (0.4, 0.100), (0.6, 0.167), (0.8, 0.433),
        (1.0, 0.667), (1.2, 0.833), (1.5, 0.933), (2.0, 1.000),
    ]

    def test_fitted_r0_falls_within_the_tested_r_range(self):
        kFit, r0 = fitter.fitSigmoid(self.dataPoints)
        rValuesOnly = [r for r, _ in self.dataPoints]
        assert min(rValuesOnly) <= r0 <= max(rValuesOnly)

    def test_fitted_kFit_is_not_collapsed_to_near_zero(self):
        kFit, _ = fitter.fitSigmoid(self.dataPoints)
        assert abs(kFit) > 0.1

    def test_fitted_loss_is_meaningfully_small(self):
        kFit, r0 = fitter.fitSigmoid(self.dataPoints)
        loss = sumSquaredLoss(self.dataPoints, kFit, r0)
        assert loss < 0.5
