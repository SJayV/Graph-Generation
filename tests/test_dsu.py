"""Tests for DSU / component invariants.

Assumed interface:
    class dsu.DSU:
        def __init__(self, allVertices: list, specialSubset: list): ...
        def find(self, vertex) -> Any            # current root of vertex
        def union(self, a, b) -> Any              # merges components, returns new root
        def sCount(self, root) -> int             # number of special-subset members
                                                    # currently rooted at `root`
        def componentCount(self) -> int           # number of distinct current components
"""
import dsu as dsu_module


def buildDsu(allVertices, specialSubset):
    return dsu_module.DSU(allVertices, specialSubset)


class TestPartitionProperty:
    def test_every_vertex_resolves_to_a_single_stable_root(self):
        allVertices = [(0, 0), (1, 0), (2, 0), (3, 0)]
        special = [(0, 0), (2, 0)]
        structure = buildDsu(allVertices, special)
        structure.union((0, 0), (1, 0))

        rootsOfEachVertex = {vertex: structure.find(vertex) for vertex in allVertices}
        for vertex in allVertices:
            assert structure.find(vertex) == rootsOfEachVertex[vertex]

    def test_component_count_never_exceeds_vertex_count(self):
        allVertices = [(0, 0), (1, 0), (2, 0)]
        structure = buildDsu(allVertices, [])
        assert structure.componentCount() <= len(allVertices)


class TestSingletonInitialization:
    def test_every_vertex_is_in_its_own_component_before_any_union(self):
        allVertices = [(0, 0), (1, 0), (2, 0)]
        structure = buildDsu(allVertices, [])
        roots = {structure.find(vertex) for vertex in allVertices}
        assert len(roots) == len(allVertices)

    def test_component_count_equals_vertex_count_before_any_union(self):
        allVertices = [(0, 0), (1, 0), (2, 0), (3, 0)]
        structure = buildDsu(allVertices, [])
        assert structure.componentCount() == len(allVertices)


class TestSCountInvariant:
    def test_sCount_equals_number_of_special_members_in_component(self):
        allVertices = [(0, 0), (1, 0), (2, 0), (3, 0)]
        special = [(0, 0), (2, 0), (3, 0)]
        structure = buildDsu(allVertices, special)

        rootOfSingleton = structure.find((0, 0))
        assert structure.sCount(rootOfSingleton) == 1

        structure.union((0, 0), (2, 0))
        rootAfterUnion = structure.find((0, 0))
        assert structure.sCount(rootAfterUnion) == 2

    def test_sCount_is_zero_for_component_without_special_members(self):
        allVertices = [(0, 0), (1, 0)]
        structure = buildDsu(allVertices, [])
        rootOfSingleton = structure.find((1, 0))
        assert structure.sCount(rootOfSingleton) == 0


class TestUnionAdditivity:
    def test_union_sCount_equals_sum_of_operand_sCounts(self):
        allVertices = [(0, 0), (1, 0), (2, 0), (3, 0)]
        special = [(0, 0), (1, 0), (2, 0)]
        structure = buildDsu(allVertices, special)

        rootA = structure.find((0, 0))
        rootB = structure.find((1, 0))
        countBefore = structure.sCount(rootA) + structure.sCount(rootB)

        newRoot = structure.union((0, 0), (1, 0))
        assert structure.sCount(newRoot) == countBefore


class TestUnionIdempotence:
    def test_reunion_of_already_merged_vertices_does_not_change_sCount(self):
        allVertices = [(0, 0), (1, 0), (2, 0)]
        special = [(0, 0), (2, 0)]
        structure = buildDsu(allVertices, special)
        structure.union((0, 0), (1, 0))

        rootBefore = structure.find((0, 0))
        countBefore = structure.sCount(rootBefore)

        structure.union((0, 0), (1, 0))
        rootAfter = structure.find((0, 0))
        assert structure.sCount(rootAfter) == countBefore

    def test_reunion_of_already_merged_vertices_does_not_change_component_count(self):
        allVertices = [(0, 0), (1, 0), (2, 0)]
        structure = buildDsu(allVertices, [])
        structure.union((0, 0), (1, 0))

        componentsBefore = structure.componentCount()
        structure.union((0, 0), (1, 0))
        assert structure.componentCount() == componentsBefore


class TestMonotonicComponentCount:
    def test_component_count_never_increases_after_a_sequence_of_unions(self):
        allVertices = [(0, 0), (1, 0), (2, 0), (3, 0)]
        structure = buildDsu(allVertices, [])

        history = [structure.componentCount()]
        structure.union((0, 0), (1, 0))
        history.append(structure.componentCount())
        structure.union((2, 0), (3, 0))
        history.append(structure.componentCount())
        structure.union((0, 0), (2, 0))
        history.append(structure.componentCount())

        for earlierCount, laterCount in zip(history, history[1:]):
            assert laterCount <= earlierCount
