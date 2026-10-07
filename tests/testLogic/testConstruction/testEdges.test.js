/** static, deterministic k-nearest-neighbor union edge set, no RNG. */
import { describe, expect, it } from "vitest";

import { buildNearestNeighborEdges } from "../../../logic/construction/edges.js";

const NEAREST_NEIGHBOR_COUNT = 4;

function vertexKey([x, y]) {
  return `${x},${y}`;
}

function edgeKey(edge) {
  const [u, v] = edge;
  const [ku, kv] = [vertexKey(u), vertexKey(v)].sort();
  return `${ku}|${kv}`;
}

function uniqueEdgeKeys(edges) {
  return new Set(edges.map(edgeKey));
}

describe("edges", () => {
  describe("TestEveryVertexHasAtLeastKEdges", () => {
    it("every vertex touches at least 4 edges in the result", () => {
      const allVertices = [
        [0, 0], [3, 1], [6, 0], [1, 4], [4, 5], [8, 2], [9, 6], [2, 8], [5, 9], [7, 3],
      ];
      const edges = buildNearestNeighborEdges(allVertices, NEAREST_NEIGHBOR_COUNT);

      const touchCount = new Map(allVertices.map((v) => [vertexKey(v), 0]));
      for (const [u, v] of edges) {
        touchCount.set(vertexKey(u), touchCount.get(vertexKey(u)) + 1);
        touchCount.set(vertexKey(v), touchCount.get(vertexKey(v)) + 1);
      }
      for (const vertex of allVertices) {
        expect(touchCount.get(vertexKey(vertex))).toBeGreaterThanOrEqual(4);
      }
    });
  });

  describe("TestNoDuplicatePairs", () => {
    it("no unordered pair appears twice", () => {
      const allVertices = [
        [0, 0], [3, 1], [6, 0], [1, 4], [4, 5], [8, 2], [9, 6], [2, 8],
      ];
      const edges = buildNearestNeighborEdges(allVertices, NEAREST_NEIGHBOR_COUNT);
      const keys = uniqueEdgeKeys(edges);
      expect(keys.size).toBe(edges.length);
    });
  });

  describe("TestNoSelfPairs", () => {
    it("never pairs a vertex with itself", () => {
      const allVertices = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]];
      const edges = buildNearestNeighborEdges(allVertices, NEAREST_NEIGHBOR_COUNT);
      for (const [u, v] of edges) {
        expect(vertexKey(u)).not.toBe(vertexKey(v));
      }
    });
  });

  describe("TestHandConstructedExactResult", () => {
    // v0..v4 mutually close, v5 far to the right - each of v0..v4 excludes v5
    // as its farthest, v5 excludes v0 as its farthest -> {v0,v5} never claimed
    it("matches the hand-computed union exactly", () => {
      const [v0, v1, v2, v3, v4, v5] = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [10, 0]];
      const allVertices = [v0, v1, v2, v3, v4, v5];

      const edges = buildNearestNeighborEdges(allVertices, NEAREST_NEIGHBOR_COUNT);
      const keys = uniqueEdgeKeys(edges);

      const expectedPresent = [
        [v0, v1], [v0, v2], [v0, v3], [v0, v4],
        [v1, v2], [v1, v3], [v1, v4],
        [v2, v3], [v2, v4],
        [v3, v4],
        [v5, v1], [v5, v2], [v5, v3], [v5, v4],
      ];
      for (const pair of expectedPresent) {
        expect(keys.has(edgeKey(pair))).toBe(true);
      }
      expect(keys.has(edgeKey([v0, v5]))).toBe(false);
      expect(keys.size).toBe(14);
    });
  });

  describe("TestCappedWhenFewerThanKOthersExist", () => {
    it("caps each vertex's neighbors at the available others, no error, no padding", () => {
      const allVertices = [[0, 0], [5, 0], [2, 4]];
      const edges = buildNearestNeighborEdges(allVertices, NEAREST_NEIGHBOR_COUNT);
      const keys = uniqueEdgeKeys(edges);

      // only 2 others exist per vertex -> complete graph on 3 vertices, no more, no less
      expect(keys.size).toBe(3);
      for (const [u, v] of edges) {
        expect(allVertices.some((vertex) => vertexKey(vertex) === vertexKey(u))).toBe(true);
        expect(allVertices.some((vertex) => vertexKey(vertex) === vertexKey(v))).toBe(true);
      }
    });
  });

  describe("TestSmallerNeighborCount", () => {
    it("a smaller nearestNeighborCount keeps its own per-vertex minimum and yields no more edges than a larger one", () => {
      const allVertices = [
        [0, 0], [3, 1], [6, 0], [1, 4], [4, 5], [8, 2], [9, 6], [2, 8], [5, 9], [7, 3],
      ];
      const smallerEdges = buildNearestNeighborEdges(allVertices, 2);
      const touchCount = new Map(allVertices.map((v) => [vertexKey(v), 0]));
      for (const [u, v] of smallerEdges) {
        touchCount.set(vertexKey(u), touchCount.get(vertexKey(u)) + 1);
        touchCount.set(vertexKey(v), touchCount.get(vertexKey(v)) + 1);
      }
      for (const vertex of allVertices) {
        expect(touchCount.get(vertexKey(vertex))).toBeGreaterThanOrEqual(2);
      }
      const largerEdges = buildNearestNeighborEdges(allVertices, NEAREST_NEIGHBOR_COUNT);
      expect(smallerEdges.length).toBeLessThanOrEqual(largerEdges.length);
    });
  });
});
