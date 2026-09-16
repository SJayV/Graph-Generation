"""Tests for vertex sampling constraints.

Assumed interface:
    vertices.sampleVertices(n: int, L: int, rng: random.Random) -> list[tuple[int, int]]
        Returns exactly n vertices with pairwise-distinct integer
        coordinates, each within {0, ..., L}^2. Raises ValueError when n
        exceeds the number of distinct grid points available, (L + 1) ** 2.
"""
import random

import pytest

import vertices


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