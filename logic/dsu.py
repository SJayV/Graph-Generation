"""Disjoint-set union (union-find) over vertices, tracking special-subset
membership counts per component.
"""
from typing import Any, Hashable


class DSU:
    """Union-find structure over allVertices, tracking how many members of
    specialSubset currently belong to each component.
    """

    def __init__(self, allVertices: list, specialSubset: list) -> None:
        self.specialSubset: list = list(specialSubset)
        specialAsSet = set(self.specialSubset)

        self._parent: dict[Hashable, Hashable] = {vertex: vertex for vertex in allVertices}
        self._size: dict[Hashable, int] = {vertex: 1 for vertex in allVertices}
        self._specialCount: dict[Hashable, int] = {
            vertex: (1 if vertex in specialAsSet else 0) for vertex in allVertices
        }
        self._componentCount: int = len(allVertices)

    def find(self, vertex: Any) -> Any:
        root = vertex
        while self._parent[root] != root:
            root = self._parent[root]

        # Path compression.
        current = vertex
        while self._parent[current] != root:
            nextVertex = self._parent[current]
            self._parent[current] = root
            current = nextVertex

        return root

    def union(self, a: Any, b: Any) -> Any:
        rootA = self.find(a)
        rootB = self.find(b)
        if rootA == rootB:
            return rootA

        smallerRoot, largerRoot = sorted(
            (rootA, rootB), key=lambda root: self._size[root]
        )

        self._parent[smallerRoot] = largerRoot
        self._size[largerRoot] += self._size[smallerRoot]
        self._specialCount[largerRoot] += self._specialCount[smallerRoot]
        del self._size[smallerRoot]
        del self._specialCount[smallerRoot]
        self._componentCount -= 1

        return largerRoot

    def sCount(self, root: Any) -> int:
        return self._specialCount.get(root, 0)

    def componentCount(self) -> int:
        return self._componentCount
