"""Shared pytest fixtures for the empirical/ test suite.

Assumed interfaces under test (short form; each test file repeats the
part relevant to it):
- trialRunner.runTrials(r, n, L, k, N, rng) -> float
    Proportion in [0, 1] of N independent trials in which every member
    of a freshly-sampled size-k special subset ends up sharing a DSU
    root after growEdges(r) on a freshly-sampled n-vertex graph. Draws
    from, and advances, the caller-supplied random.Random instance.
- fitter.fitSigmoid(dataPoints: list[tuple[float, float]])
    -> tuple[float, float]
    Returns (kFit, r0) for p(r) = 1 / (1 + exp(-kFit * (r - r0))),
    fit via hand-rolled optimization on the given (r, proportion)
    pairs. Pure function of its input list.
- orchestrator.sweepAndFit(rValues, n, L, k, N, rng) -> SweepResult
    SweepResult.rawResults: list[tuple[float, float]]  # one per r, in order
    SweepResult.kFit: float
    SweepResult.r0: float
    Composes trialRunner.runTrials once per r (sharing one advancing
    rng across the whole sweep) with fitter.fitSigmoid on the
    resulting raw data.

Fixtures build fresh objects per test (function scope), so no mutable
state is shared across tests. This conftest.py is independent of
tests/testLogic/conftest.py (pytest conftest discovery does not cross
sibling directories).
"""
import random

import pytest


@pytest.fixture
def rng():
    """A fresh, deterministically seeded RNG, isolated per test."""
    return random.Random(1234)