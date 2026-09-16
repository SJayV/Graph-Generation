"""Tests for the special subset S.

Assumed interface:
    vertices.selectSpecialSubset(allVertices: list[tuple[int, int]], k: int,
                                  rng: random.Random) -> list[tuple[int, int]]
        Returns a subset of allVertices of size exactly k (0 <= k <= n),
        containing no duplicate members. Raises ValueError when k is
        negative or larger than len(allVertices).
"""
import random

import pytest

import vertices


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