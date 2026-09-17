"""Vertex sampling and special-subset selection on a discrete grid."""
import random


def sampleVertices(n: int, L: int, rng: random.Random) -> list[tuple[int, int]]:
    """Sample n pairwise-distinct integer coordinates from {0,...,L}^2."""
    gridSideLength = L + 1
    gridCapacity = gridSideLength * gridSideLength
    if n > gridCapacity:
        raise ValueError(f"cannot sample {n} unique vertices from a grid of capacity {gridCapacity}")

    allGridPoints = [(x, y) for x in range(gridSideLength) for y in range(gridSideLength)]
    return rng.sample(allGridPoints, n)


def selectSpecialSubset(allVertices: list[tuple[int, int]], k: int, rng: random.Random) -> list[tuple[int, int]]:
    """Select k distinct members of allVertices to form the special subset."""
    if k < 0 or k > len(allVertices):
        raise ValueError(f"k={k} must satisfy 0 <= k <= {len(allVertices)}")
    return rng.sample(allVertices, k)
