"""Greedy, field-priority-driven edge growth over a fixed vertex set."""
import heapq
import math
from itertools import combinations
from typing import Iterator, NamedTuple

import dsu
import field


# ===== TYPES =====

class GrowthResult(NamedTuple):
    edges: set[frozenset]
    dsu: dsu.DSU


# ===== HELPER FUNCTIONS - EDGE GROWTH =====

def _targetEdgeCount(vertexCount: int, r: float) -> int:
    maxEdges = math.comb(vertexCount, 2)
    return min(math.floor(r * vertexCount), maxEdges)


def _buildInitialHeap(allVertices: list, structure: dsu.DSU, sigma: float) -> list:
    heap = []
    for pair in _candidatePairs(allVertices):
        u, v = tuple(pair)
        priority = field.key(structure, u, v, sigma)
        heapq.heappush(heap, (-priority, u, v))
    return heap


def _acceptedEdges(allVertices: list, structure: dsu.DSU, r: float, sigma: float) -> Iterator[frozenset]:
    targetEdgeCount = _targetEdgeCount(len(allVertices), r)
    heap = _buildInitialHeap(allVertices, structure, sigma)

    acceptedCount = 0
    while acceptedCount < targetEdgeCount and heap:
        poppedPriority, u, v = heapq.heappop(heap)
        currentPriority = field.key(structure, u, v, sigma)

        if currentPriority == -poppedPriority:
            structure.union(u, v)
            acceptedCount += 1
            yield frozenset((u, v))
        else:
            heapq.heappush(heap, (-currentPriority, u, v))


def _candidatePairs(allVertices: list) -> set[frozenset]:
    """All unordered pairs {u, v} with u != v drawn from allVertices."""
    return {frozenset(pair) for pair in combinations(allVertices, 2)}


# ===== PUBLIC INTERFACE =====

def growEdgesStepwise(allVertices: list, specialSubset: list, r: float, sigma: float) -> Iterator[frozenset]:
    """Yield accepted edges one at a time, in acceptance order."""
    structure = dsu.DSU(allVertices, specialSubset)
    yield from _acceptedEdges(allVertices, structure, r, sigma)


def growEdges(allVertices: list, specialSubset: list, r: float, sigma: float) -> GrowthResult:
    """Grow edges greedily by field priority until the target count is reached."""
    structure = dsu.DSU(allVertices, specialSubset)
    edges = set(_acceptedEdges(allVertices, structure, r, sigma))
    return GrowthResult(edges = edges, dsu = structure)