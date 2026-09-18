"""Tests for the export-shape conversion of a generated graph.

Assumed interface:
    exportGraph._toExportShape(allVertices: list, specialSubset: set, edgeSequence: list) -> dict
        Returns {"vertices": [[x, y, isSpecial], ...], "edgeSequence": [[startIndex, endIndex], ...]}
        where isSpecial is True exactly for vertices that are members of
        specialSubset, and False otherwise.
"""
from exportGraph import _toExportShape

ALL_VERTICES = [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0), (6, 0)]


def _specialFlags(allVertices, specialSubset):
    """Run _toExportShape with an empty edge sequence and return the list of
    isSpecial flags, one per vertex, in allVertices order.
    """
    exported = _toExportShape(allVertices, specialSubset, [])
    return [isSpecial for _x, _y, isSpecial in exported["vertices"]]


# ===== SPECIAL SUBSET COUNT =====

class TestSpecialCount:
    def test_toExportShape_flags_zero_vertices_when_subset_is_empty(self):
        specialSubset = set()
        flags = _specialFlags(ALL_VERTICES, specialSubset)
        assert sum(flags) == len(specialSubset) == 0

    def test_toExportShape_flags_exactly_one_vertex_for_singleton_subset(self):
        specialSubset = {ALL_VERTICES[3]}
        flags = _specialFlags(ALL_VERTICES, specialSubset)
        assert sum(flags) == len(specialSubset) == 1

    def test_toExportShape_flags_exactly_k_vertices_for_several_but_not_all(self):
        k = 4
        specialSubset = set(ALL_VERTICES[:k])
        flags = _specialFlags(ALL_VERTICES, specialSubset)
        assert sum(flags) == len(specialSubset) == k
        assert k < len(ALL_VERTICES)  # sanity: not the full vertex set

    def test_toExportShape_flags_all_vertices_when_subset_is_the_full_set(self):
        specialSubset = set(ALL_VERTICES)
        flags = _specialFlags(ALL_VERTICES, specialSubset)
        assert sum(flags) == len(specialSubset) == len(ALL_VERTICES)


# ===== SPECIAL SUBSET MEMBERSHIP =====

class TestSpecialMembership:
    def test_toExportShape_flags_exactly_the_special_subset_members(self):
        specialSubset = {ALL_VERTICES[1], ALL_VERTICES[4], ALL_VERTICES[5]}
        exported = _toExportShape(ALL_VERTICES, specialSubset, [])

        flaggedVertices = {
            (x, y) for x, y, isSpecial in exported["vertices"] if isSpecial
        }
        unflaggedVertices = {
            (x, y) for x, y, isSpecial in exported["vertices"] if not isSpecial
        }

        assert flaggedVertices == specialSubset
        assert unflaggedVertices == set(ALL_VERTICES) - specialSubset

    def test_toExportShape_flags_no_vertex_when_subset_is_empty(self):
        exported = _toExportShape(ALL_VERTICES, set(), [])
        flaggedVertices = {
            (x, y) for x, y, isSpecial in exported["vertices"] if isSpecial
        }
        assert flaggedVertices == set()
