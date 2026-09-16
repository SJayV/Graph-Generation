"""Gaussian-field priority score used by the greedy edge-growth algorithm."""
import math
from typing import Any

PRIORITY_OFFSET: float = 0.0


def gaussian(x: tuple[float, float], mu: tuple[float, float], sigma: float) -> float:
    """Unnormalized isotropic 2D Gaussian bump centred at mu."""
    squaredDistance = (x[0] - mu[0]) ** 2 + (x[1] - mu[1]) ** 2
    return math.exp(-squaredDistance / (2 * sigma * sigma))


def fieldValue(dsu: Any, root: Any, x: tuple[float, float], sigma: float) -> float:
    """Strength-weighted sum of Gaussian densities from special members of
    the component rooted at `root`, evaluated at point x.
    """
    specialCount = dsu.sCount(root)
    if specialCount == 0:
        return 0.0

    specialMembersAtRoot = (
        member for member in dsu.specialSubset if dsu.find(member) == root
    )
    gaussianSum = sum(gaussian(x, member, sigma) for member in specialMembersAtRoot)
    return math.sqrt(specialCount) * gaussianSum


def key(dsu: Any, u: Any, v: Any, sigma: float) -> float:
    """Symmetric priority score for the unordered pair {u, v}."""
    fieldOfUAtV = fieldValue(dsu, dsu.find(u), v, sigma)
    fieldOfVAtU = fieldValue(dsu, dsu.find(v), u, sigma)
    return PRIORITY_OFFSET + max(fieldOfUAtV, fieldOfVAtU)