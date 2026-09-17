"""Tests for the Gaussian field and priority key.

Assumed interface:
    field.gaussian(x, mu, sigma) -> float
    field.fieldValue(dsu, vertex, x, sigma) -> float
        A single Gaussian bump centred on `vertex`'s own fixed position,
        scaled by sqrt(|C(find(vertex))|).
        The bump is always anchored to `vertex` itself, never
        to whichever special member happens to be in its component, and
        never to a DSU root's position (a root is just whichever vertex
        union-by-size happened to keep as representative; `vertex` and
        its current root can differ once real unions have occurred).
    field.key(dsu, u, v, sigma) -> float
        Symmetric priority score for the unordered pair {u, v}:
        p0 + (fieldValue(dsu, v, u, sigma) + fieldValue(dsu, u, v, sigma)),
        i.e. a SUM (not a max) of the two directional field values. This
        collapses to p0 + gaussian(u, v, sigma) * (str(u) + str(v)) since
        the Gaussian term only depends on the distance between u and v.

    dsu.DSU (see test_dsu.py) supplies find() / sCount() / union() used
    internally by fieldValue and key.

Sigma is treated as an ordinary caller-supplied float throughout these
tests (its fixed default value is a project constant and is not itself
under test here).
"""
import math

import dsu as dsu_module
import field


def buildDsu(allVertices, specialSubset):
    return dsu_module.DSU(allVertices, specialSubset)


class TestFieldPurity:
    def test_fieldValue_is_deterministic_for_same_inputs(self):
        allVertices = [(0, 0), (5, 5), (10, 10)]
        special = [(0, 0), (5, 5)]
        structure = buildDsu(allVertices, special)
        sigma = 2.0

        first = field.fieldValue(structure, (0, 0), (7, 7), sigma)
        second = field.fieldValue(structure, (0, 0), (7, 7), sigma)
        assert first == second

    def test_fieldValue_unchanged_when_recomputed_without_state_change(self):
        allVertices = [(0, 0), (1, 1)]
        structure = buildDsu(allVertices, [(0, 0)])
        sigma = 1.5

        before = field.fieldValue(structure, (0, 0), (2, 2), sigma)
        after = field.fieldValue(structure, (0, 0), (2, 2), sigma)
        assert before == after


class TestFieldNonNegativity:
    def test_fieldValue_is_never_negative(self):
        allVertices = [(0, 0), (3, 3), (6, 6)]
        special = [(0, 0), (3, 3), (6, 6)]
        structure = buildDsu(allVertices, special)
        sigma = 4.0

        for point in [(0, 0), (3, 3), (6, 6), (100, 100), (-50, -50)]:
            assert field.fieldValue(structure, (0, 0), point, sigma) >= 0


class TestFieldZeroExactlyWhenComponentHasNoSpecialMembers:
    def test_fieldValue_is_zero_when_component_has_no_special_members(self):
        allVertices = [(0, 0), (1, 1)]
        structure = buildDsu(allVertices, [])
        sigma = 3.0
        assert field.fieldValue(structure, (0, 0), (9, 9), sigma) == 0

    def test_fieldValue_is_nonzero_when_component_has_a_special_member(self):
        allVertices = [(0, 0), (1, 1)]
        structure = buildDsu(allVertices, [(0, 0)])
        sigma = 3.0
        assert field.fieldValue(structure, (0, 0), (0, 0), sigma) > 0


class TestKeySymmetry:
    def test_key_is_symmetric_under_argument_swap(self):
        allVertices = [(0, 0), (4, 4), (8, 8)]
        special = [(0, 0), (8, 8)]
        structure = buildDsu(allVertices, special)
        sigma = 2.0

        keyForward = field.key(structure, (0, 0), (4, 4), sigma)
        keyBackward = field.key(structure, (4, 4), (0, 0), sigma)
        assert keyForward == keyBackward


class TestKeyDependsOnlyOnCurrentComponentState:
    def test_key_matches_across_different_histories_reaching_the_same_state(self):
        allVertices = [(0, 0), (1, 0), (2, 0), (3, 0)]
        special = [(0, 0), (1, 0)]
        sigma = 2.0

        structureA = buildDsu(allVertices, special)
        structureA.union((0, 0), (1, 0))

        structureB = buildDsu(allVertices, special)
        structureB.union((0, 0), (1, 0))
        structureB.union((1, 0), (0, 0))  # idempotent re-union, same eventual state

        keyFromA = field.key(structureA, (2, 0), (3, 0), sigma)
        keyFromB = field.key(structureB, (2, 0), (3, 0), sigma)
        assert keyFromA == keyFromB


class TestFieldIsAnchoredToTheQueriedVertexNotToASpecialComponentMember:
    def test_fieldValue_after_union_is_centred_on_the_queried_vertex_itself(self):
        a = (0, 0)
        b = (20, 20)
        allVertices = [a, b]
        special = [a]
        sigma = 3.0

        structure = buildDsu(allVertices, special)
        structure.union(a, b)

        componentSCount = structure.sCount(structure.find(b))
        assert componentSCount == 1  # sanity check: a's membership merged into b's component

        actual = field.fieldValue(structure, b, b, sigma)

        expectedNewModel = math.sqrt(componentSCount) * field.gaussian(b, b, sigma)
        expectedIfBumpWereCentredOnA = math.sqrt(componentSCount) * field.gaussian(b, a, sigma)

        assert actual == expectedNewModel
        assert actual != expectedIfBumpWereCentredOnA
