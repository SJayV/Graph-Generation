"""Tests for the Gaussian field and priority key.

Assumed interface:
    field.gaussian(x, mu, sigma) -> float
    field.fieldValue(dsu, root, x, sigma) -> float
        Strength-weighted sum of Gaussian densities contributed by the
        special-subset members currently rooted at `root`.
    field.key(dsu, u, v, sigma) -> float
        Symmetric priority score for the unordered pair {u, v}.

    dsu.DSU (see test_dsu.py) supplies find() / sCount() / union() used
    internally by fieldValue and key.

Sigma is treated as an ordinary caller-supplied float throughout these
tests (its fixed default value is a project constant and is not itself
under test here).
"""
import dsu as dsu_module
import field


def buildDsu(allVertices, specialSubset):
    return dsu_module.DSU(allVertices, specialSubset)


class TestFieldPurity:
    def test_fieldValue_is_deterministic_for_same_inputs(self):
        allVertices = [(0, 0), (5, 5), (10, 10)]
        special = [(0, 0), (5, 5)]
        structure = buildDsu(allVertices, special)
        root = structure.find((0, 0))
        sigma = 2.0

        first = field.fieldValue(structure, root, (7, 7), sigma)
        second = field.fieldValue(structure, root, (7, 7), sigma)
        assert first == second

    def test_fieldValue_unchanged_when_recomputed_without_state_change(self):
        allVertices = [(0, 0), (1, 1)]
        structure = buildDsu(allVertices, [(0, 0)])
        root = structure.find((0, 0))
        sigma = 1.5

        before = field.fieldValue(structure, root, (2, 2), sigma)
        after = field.fieldValue(structure, root, (2, 2), sigma)
        assert before == after


class TestFieldNonNegativity:
    def test_fieldValue_is_never_negative(self):
        allVertices = [(0, 0), (3, 3), (6, 6)]
        special = [(0, 0), (3, 3), (6, 6)]
        structure = buildDsu(allVertices, special)
        root = structure.find((0, 0))
        sigma = 4.0

        for point in [(0, 0), (3, 3), (6, 6), (100, 100), (-50, -50)]:
            assert field.fieldValue(structure, root, point, sigma) >= 0


class TestFieldZeroExactlyWhenComponentHasNoSpecialMembers:
    def test_fieldValue_is_zero_when_component_has_no_special_members(self):
        allVertices = [(0, 0), (1, 1)]
        structure = buildDsu(allVertices, [])
        root = structure.find((0, 0))
        sigma = 3.0
        assert field.fieldValue(structure, root, (9, 9), sigma) == 0

    def test_fieldValue_is_nonzero_when_component_has_a_special_member(self):
        allVertices = [(0, 0), (1, 1)]
        structure = buildDsu(allVertices, [(0, 0)])
        root = structure.find((0, 0))
        sigma = 3.0
        assert field.fieldValue(structure, root, (0, 0), sigma) > 0


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