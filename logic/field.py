"""Gaussian-field priority score used by the greedy edge-growth algorithm."""
import math
from typing import Any

PRIORITY_OFFSET: float = 0.0


def gaussian(x: tuple[float, float], mu: tuple[float, float], sigma: float) -> float:
    """Unnormalized isotropic 2D Gaussian bump centred at mu."""
    squaredDistance = (x[0] - mu[0]) ** 2 + (x[1] - mu[1]) ** 2
    return math.exp(-squaredDistance / (2 * sigma * sigma))


def fieldValue(dsu: Any, vertex: Any, x: tuple[float, float], sigma: float) -> float:
    """Strength-scaled Gaussian bump centred on `vertex` itself, evaluated at
    point x. The strength is sqrt of the special-subset count of vertex's current component.
    """
    specialCount = dsu.sCount(dsu.find(vertex))
    if specialCount == 0:
        return 0.0

    return math.sqrt(specialCount) * gaussian(x, vertex, sigma)


def key(dsu: Any, u: Any, v: Any, sigma: float) -> float:
    """Symmetric priority score for the unordered pair {u, v}."""
    fieldOfVAtU = fieldValue(dsu, v, u, sigma)
    fieldOfUAtV = fieldValue(dsu, u, v, sigma)
    return PRIORITY_OFFSET + fieldOfVAtU + fieldOfUAtV
