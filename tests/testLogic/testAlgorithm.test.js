/**
 * logic/algorithm.js: _candidatePairs, growEdges, growEdgesStepwise
 * edge-selection algorithm; edges keyed value-based via local edgeKey helper
 */
import { describe, expect, it } from "vitest";

import * as algorithm from "../../logic/algorithm.js";

function makeVertices(n) {
  return Array.from({ length: n }, (_, i) => [i, 0]);
}

function nChoose2(n) {
  return (n * (n - 1)) / 2;
}

function vertexKey(vertex) {
  return `${vertex[0]},${vertex[1]}`;
}

function edgeKey(edge) {
  const [u, v] = edge;
  const [ku, kv] = [vertexKey(u), vertexKey(v)].sort();
  return `${ku}|${kv}`;
}

function uniqueEdgeKeys(edges) {
  return new Set(edges.map(edgeKey));
}

describe("algorithm", () => {
  describe("TestCandidatePoolInitialization", () => {
    it("candidatePairs has size n choose 2", () => {
      const allVertices = makeVertices(6);
      const pairs = algorithm._candidatePairs(allVertices);
      expect(pairs.length).toBe(nChoose2(allVertices.length));
    });

    it("candidatePairs excludes self pairs", () => {
      const allVertices = makeVertices(5);
      const pairs = algorithm._candidatePairs(allVertices);
      for (const [u, v] of pairs) {
        expect(vertexKey(u)).not.toBe(vertexKey(v));
      }
    });

    it("candidatePairs contains only unordered pairs (no duplicates)", () => {
      const allVertices = makeVertices(4);
      const pairs = algorithm._candidatePairs(allVertices);
      const keys = uniqueEdgeKeys(pairs);
      expect(keys.size).toBe(pairs.length);
      for (const pair of pairs) {
        expect(pair).toHaveLength(2);
      }
    });
  });

  describe("TestAcceptedEdgesAreNeverReconsidered", () => {
    it("edge set grows monotonically with no repeated emissions", () => {
      const allVertices = makeVertices(6);
      const special = [allVertices[0], allVertices[1]];
      const sigma = 1.0;

      const emittedSoFar = new Set();
      for (const edge of algorithm.growEdgesStepwise(allVertices, special, 1.5, sigma)) {
        const key = edgeKey(edge);
        expect(emittedSoFar.has(key)).toBe(false);
        emittedSoFar.add(key);
      }
    });

    it("stepwise emissions are a subset of the final edge set", () => {
      const allVertices = makeVertices(6);
      const special = [allVertices[0], allVertices[1]];
      const sigma = 1.0;

      const emittedSoFar = uniqueEdgeKeys([...algorithm.growEdgesStepwise(allVertices, special, 1.5, sigma)]);
      const result = algorithm.growEdges(allVertices, special, 1.5, sigma);
      const finalKeys = uniqueEdgeKeys(result.edges);

      for (const key of emittedSoFar) {
        expect(finalKeys.has(key)).toBe(true);
      }
    });
  });

  describe("TestTermination", () => {
    it("edge count equals m when m is below the maximum", () => {
      const allVertices = makeVertices(8);
      const special = allVertices.slice(0, 3);
      const sigma = 1.0;
      const n = allVertices.length;
      const r = 1.0;
      const m = Math.floor(r * n);
      const maxEdges = nChoose2(n);
      expect(m).toBeLessThan(maxEdges); // sanity check on the chosen scenario

      const result = algorithm.growEdges(allVertices, special, r, sigma);
      expect(result.edges.length).toBe(Math.min(m, maxEdges));
    });

    it("edge count caps at n choose 2 when r implies more edges than possible", () => {
      const allVertices = makeVertices(5);
      const special = allVertices.slice(0, 2);
      const sigma = 1.0;
      const n = allVertices.length;
      const r = 1000.0;
      const m = Math.floor(r * n);
      const maxEdges = nChoose2(n);
      expect(m).toBeGreaterThan(maxEdges); // sanity check: r is deliberately oversized

      const result = algorithm.growEdges(allVertices, special, r, sigma);
      expect(result.edges.length).toBe(maxEdges);
    });

    it("oversized r still terminates", () => {
      const allVertices = makeVertices(6);
      const special = allVertices.slice(0, 2);
      const sigma = 1.0;

      // Regression guard: this call must return rather than hang.
      const result = algorithm.growEdges(allVertices, special, 1_000_000.0, sigma);
      expect(result.edges.length).toBe(nChoose2(allVertices.length));
    });
  });

  describe("TestNoSelfLoopsOrDuplicates", () => {
    it("no self-loop edges present", () => {
      const allVertices = makeVertices(6);
      const special = allVertices.slice(0, 2);
      const result = algorithm.growEdges(allVertices, special, 2.0, 1.0);
      for (const [u, v] of result.edges) {
        expect(vertexKey(u)).not.toBe(vertexKey(v));
      }
    });

    it("no duplicate unordered pairs", () => {
      const allVertices = makeVertices(6);
      const special = allVertices.slice(0, 2);
      const result = algorithm.growEdges(allVertices, special, 2.0, 1.0);
      const keys = uniqueEdgeKeys(result.edges);
      expect(keys.size).toBe(result.edges.length);
    });
  });

  describe("TestDsuPartitionMatchesConnectedComponents", () => {
    function connectedComponentLabels(vertices, edges) {
      /** Plain BFS over the edge set, independent of any DSU implementation. */
      const adjacency = new Map();
      for (const vertex of vertices) {
        adjacency.set(vertexKey(vertex), new Set());
      }

      const vertexByKey = new Map(vertices.map((v) => [vertexKey(v), v]));

      for (const [u, v] of edges) {
        adjacency.get(vertexKey(u)).add(vertexKey(v));
        adjacency.get(vertexKey(v)).add(vertexKey(u));
      }

      const labels = new Map();
      let nextLabel = 0;
      for (const start of vertices) {
        const startKey = vertexKey(start);
        if (labels.has(startKey)) {
          continue;
        }
        const stack = [startKey];
        labels.set(startKey, nextLabel);
        while (stack.length > 0) {
          const nodeKey = stack.pop();
          for (const neighborKey of adjacency.get(nodeKey)) {
            if (!labels.has(neighborKey)) {
              labels.set(neighborKey, nextLabel);
              stack.push(neighborKey);
            }
          }
        }
        nextLabel += 1;
      }

      const labelsByVertexKey = labels;
      return { labelsByVertexKey, vertexByKey };
    }

    it("dsu grouping agrees with edge connected components", () => {
      const allVertices = makeVertices(5);
      const special = [allVertices[0], allVertices[1]];
      const sigma = 1.0;

      const result = algorithm.growEdges(allVertices, special, 1.5, sigma);
      const maxEdges = nChoose2(allVertices.length);
      expect(result.edges.length).toBeGreaterThan(0);
      expect(result.edges.length).toBeLessThan(maxEdges); // sanity: a non-trivial partial graph

      const { labelsByVertexKey } = connectedComponentLabels(allVertices, result.edges);

      for (let i = 0; i < allVertices.length; i++) {
        for (let j = i + 1; j < allVertices.length; j++) {
          const u = allVertices[i];
          const v = allVertices[j];
          const sameComponent = labelsByVertexKey.get(vertexKey(u)) === labelsByVertexKey.get(vertexKey(v));
          const sameDsuGroup = vertexKey(result.dsu.find(u)) === vertexKey(result.dsu.find(v));
          expect(sameComponent).toBe(sameDsuGroup);
        }
      }
    });
  });
});
