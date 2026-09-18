"""Tests for vertex sampling constraints and the special subset S.

Assumed interface:
    vertices.sampleVertices(n: int, L: int, rng: random.Random) -> list[tuple[int, int]]
        Returns exactly n vertices with pairwise-distinct integer
        coordinates, each within {0, ..., L}^2. Raises ValueError when n
        exceeds the number of distinct grid points available, (L + 1) ** 2.

    vertices.selectSpecialSubset(allVertices: list[tuple[int, int]], k: int,
                                  rng: random.Random) -> list[tuple[int, int]]
        Returns a subset of allVertices of size exactly k (0 <= k <= n),
        containing no duplicate members. Raises ValueError when k is
        negative or larger than len(allVertices).
"""
import random

import pytest
import vertices

# ===== SAMPLE VERTICES =====

class TestVertexCount:
    def test_sampleVertices_returns_exactly_n_vertices(self, rng):
        n, L = 10, 20
        result = vertices.sampleVertices(n, L, rng)
        assert len(result) == n

    def test_sampleVertices_with_minimal_n_returns_one_vertex(self, rng):
        result = vertices.sampleVertices(1, 5, rng)
        assert len(result) == 1


class TestGridCapacity:
    def test_sampleVertices_rejects_n_larger_than_grid_capacity(self, rng):
        L = 2  # grid has (L + 1) ** 2 == 9 points
        with pytest.raises(ValueError):
            vertices.sampleVertices(10, L, rng)

    def test_sampleVertices_accepts_n_equal_to_grid_capacity(self, rng):
        L = 2
        n = (L + 1) ** 2
        result = vertices.sampleVertices(n, L, rng)
        assert len(result) == n


class TestUniqueness:
    def test_sampleVertices_produces_pairwise_distinct_coordinates(self, rng):
        n, L = 50, 30
        result = vertices.sampleVertices(n, L, rng)
        assert len(set(result)) == len(result)

    def test_sampleVertices_is_deterministic_given_same_seeded_rng(self):
        firstRun = vertices.sampleVertices(20, 15, random.Random(42))
        secondRun = vertices.sampleVertices(20, 15, random.Random(42))
        assert firstRun == secondRun


class TestCoordinateDomain:
    def test_sampleVertices_coordinates_within_grid_bounds(self, rng):
        n, L = 30, 12
        result = vertices.sampleVertices(n, L, rng)
        for x, y in result:
            assert 0 <= x <= L
            assert 0 <= y <= L

    def test_sampleVertices_coordinates_are_integers(self, rng):
        result = vertices.sampleVertices(15, 10, rng)
        for x, y in result:
            assert isinstance(x, int)
            assert isinstance(y, int)


# ===== SELECT SPECIAL SUBSET =====

@pytest.fixture
def sampledVertices():
    return vertices.sampleVertices(n=20, L=15, rng=random.Random(7))


class TestSubsetMembership:
    def test_selectSpecialSubset_members_all_belong_to_vertex_set(self, sampledVertices, rng):
        k = 5
        subset = vertices.selectSpecialSubset(sampledVertices, k, rng)
        assert set(subset).issubset(set(sampledVertices))


class TestSubsetSize:
    def test_selectSpecialSubset_returns_requested_size(self, sampledVertices, rng):
        k = 6
        subset = vertices.selectSpecialSubset(sampledVertices, k, rng)
        assert len(subset) == k

    def test_selectSpecialSubset_allows_k_equal_zero(self, sampledVertices, rng):
        subset = vertices.selectSpecialSubset(sampledVertices, 0, rng)
        assert subset == []

    def test_selectSpecialSubset_allows_k_equal_n(self, sampledVertices, rng):
        n = len(sampledVertices)
        subset = vertices.selectSpecialSubset(sampledVertices, n, rng)
        assert len(subset) == n

    def test_selectSpecialSubset_rejects_k_greater_than_n(self, sampledVertices, rng):
        n = len(sampledVertices)
        with pytest.raises(ValueError):
            vertices.selectSpecialSubset(sampledVertices, n + 1, rng)

    def test_selectSpecialSubset_rejects_negative_k(self, sampledVertices, rng):
        with pytest.raises(ValueError):
            vertices.selectSpecialSubset(sampledVertices, -1, rng)


class TestNoDuplicates:
    def test_selectSpecialSubset_has_no_duplicate_members(self, sampledVertices, rng):
        k = 8
        subset = vertices.selectSpecialSubset(sampledVertices, k, rng)
        assert len(set(subset)) == len(subset)
