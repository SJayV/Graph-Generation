"""Sweeps the trial-runner across a list of r values and fits a sigmoid to
the resulting (r, proportion) data.
"""
import random
from typing import NamedTuple

import fitter
import trialRunner


class SweepResult(NamedTuple):
    rawResults: list[tuple[float, float]]
    kFit: float
    r0: float


def sweepAndFit(rValues: list[float], n: int, L: int, k: int, N: int, rng: random.Random) -> SweepResult:
    """Run trialRunner.runTrials once per r in rValues, sharing one advancing
    rng across the whole sweep, then fit a sigmoid to the collected data.
    """
    rawResults = [(r, trialRunner.runTrials(r=r, n=n, L=L, k=k, N=N, rng=rng)) for r in rValues]
    kFit, r0 = fitter.fitSigmoid(rawResults)
    return SweepResult(rawResults=rawResults, kFit=kFit, r0=r0)
