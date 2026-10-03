/** identifyConnectingEdges(edges, dsu, specialSubset) -> subset of `edges` */
import { describe, expect, it } from "vitest";

import { identifyConnectingEdges } from "../../algorithms/connectingEdges.js";
import { DSU } from "../../logic/dataStructures/dsu.js";
import { edgeKey } from "../../logic/randomness/vertices.js";

// HELPER FUNCTIONS

function _buildDsu(allVertices, specialSubset, edges) {
  const dsu = new DSU(allVertices, specialSubset);
  edges.forEach(([u, v]) => dsu.union(u, v));
  return dsu;
}

function _edgeKeySet(edges) {
  return new Set(edges.map(([u, v]) => edgeKey(u, v)));
}

function _expectSameEdgeSet(actualEdges, expectedEdges) {
  expect(_edgeKeySet(actualEdges)).toEqual(_edgeKeySet(expectedEdges));
  expect(actualEdges).toHaveLength(expectedEdges.length);
}

describe("identifyConnectingEdges", () => {
  describe("excludes filler edges absorbed into the tree without joining two specials", () => {
    it("keeps exactly the straight-line path edges between two specials, dropping a dead-end branch", () => {
      const A = [0, 0];
      const B = [1, 0];
      const C = [2, 0];
      const D = [3, 0];
      const E = [4, 0];
      const F = [1, 1]; // filler leaf hanging off B, never reaches a special
      const allVertices = [A, B, C, D, E, F];
      const specialSubset = [A, E];
      const edges = [
        [A, B],
        [B, C],
        [C, D],
        [D, E],
        [B, F],
      ];
      const dsu = _buildDsu(allVertices, specialSubset, edges);

      const connectingEdges = identifyConnectingEdges(edges, dsu, specialSubset);

      _expectSameEdgeSet(connectingEdges, [
        [A, B],
        [B, C],
        [C, D],
        [D, E],
      ]);
    });

    it("preserves the original acceptance order of the edges it keeps", () => {
      const A = [0, 0];
      const B = [1, 0];
      const C = [2, 0];
      const D = [3, 0];
      const E = [4, 0];
      const F = [1, 1];
      const allVertices = [A, B, C, D, E, F];
      const specialSubset = [A, E];
      const edges = [
        [A, B],
        [B, F],
        [B, C],
        [C, D],
        [D, E],
      ];
      const dsu = _buildDsu(allVertices, specialSubset, edges);

      const connectingEdges = identifyConnectingEdges(edges, dsu, specialSubset);

      expect(connectingEdges.map(([u, v]) => edgeKey(u, v))).toEqual(
        [
          [A, B],
          [B, C],
          [C, D],
          [D, E],
        ].map(([u, v]) => edgeKey(u, v)),
      );
    });
  });

  describe("a branching tree can mark multiple edges incident to one vertex as connecting", () => {
    it("keeps every spoke of a three-way junction between three specials, dropping an unrelated leaf", () => {
      const center = [5, 5];
      const tip1 = [5, 0];
      const tip2 = [10, 5];
      const tip3 = [5, 10];
      const fillerLeaf = [0, 5];
      const allVertices = [center, tip1, tip2, tip3, fillerLeaf];
      const specialSubset = [tip1, tip2, tip3];
      const edges = [
        [center, tip1],
        [center, tip2],
        [center, tip3],
        [center, fillerLeaf],
      ];
      const dsu = _buildDsu(allVertices, specialSubset, edges);

      const connectingEdges = identifyConnectingEdges(edges, dsu, specialSubset);

      _expectSameEdgeSet(connectingEdges, [
        [center, tip1],
        [center, tip2],
        [center, tip3],
      ]);
    });
  });

  describe("no accepted edge lies on any special-to-special path", () => {
    it("returns an empty list when the accepted edges never reach a second special", () => {
      const A = [0, 0];
      const B = [1, 0];
      const C = [2, 0];
      const allVertices = [A, B, C];
      const specialSubset = [A];
      const edges = [
        [A, B],
        [B, C],
      ];
      const dsu = _buildDsu(allVertices, specialSubset, edges);

      const connectingEdges = identifyConnectingEdges(edges, dsu, specialSubset);

      expect(connectingEdges).toEqual([]);
    });
  });

  describe("fewer than two specials can never be connected", () => {
    it("returns an empty list for an empty specialSubset", () => {
      const A = [0, 0];
      const B = [1, 0];
      const allVertices = [A, B];
      const specialSubset = [];
      const edges = [[A, B]];
      const dsu = _buildDsu(allVertices, specialSubset, edges);

      expect(identifyConnectingEdges(edges, dsu, specialSubset)).toEqual([]);
    });

    it("returns an empty list for a single-member specialSubset", () => {
      const A = [0, 0];
      const B = [1, 0];
      const allVertices = [A, B];
      const specialSubset = [A];
      const edges = [[A, B]];
      const dsu = _buildDsu(allVertices, specialSubset, edges);

      expect(identifyConnectingEdges(edges, dsu, specialSubset)).toEqual([]);
    });
  });

  describe("no filler at all means every accepted edge is a connecting edge", () => {
    it("returns the full edge list unchanged when the tree is exactly the path between two specials", () => {
      const A = [0, 0];
      const B = [1, 0];
      const C = [2, 0];
      const allVertices = [A, B, C];
      const specialSubset = [A, C];
      const edges = [
        [A, B],
        [B, C],
      ];
      const dsu = _buildDsu(allVertices, specialSubset, edges);

      const connectingEdges = identifyConnectingEdges(edges, dsu, specialSubset);

      _expectSameEdgeSet(connectingEdges, edges);
    });
  });
});
