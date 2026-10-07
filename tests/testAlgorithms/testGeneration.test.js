/**
 * edges are keyed value-based via a local edgeKey helper, not by reference
 */
import { describe, expect, it } from "vitest";

import { growEdgesStepwise } from "../../algorithms/parametrization/generation.js";
import { drainEdges } from "../../algorithms/skeleton/greedyAlgorithm.js";

const DEFAULT_FIELD_SHAPE = { sigma: 1.0, dampeningFactor: 0.1, strengtheningFactor: 10 };

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

describe("algorithm", () => {
  describe("TestAcceptedEdgesAreNeverReconsidered", () => {
    it("edge set grows monotonically with no repeated emissions", () => {
      const allVertices = makeVertices(6);
      const special = [allVertices[0], allVertices[1]];

      const emittedSoFar = new Set();
      for (const edge of growEdgesStepwise(allVertices, special, 1.5, DEFAULT_FIELD_SHAPE)) {
        const key = edgeKey(edge);
        expect(emittedSoFar.has(key)).toBe(false);
        emittedSoFar.add(key);
      }
    });
  });

  describe("TestTermination", () => {
    it("edge count equals m when m is below the maximum", () => {
      const allVertices = makeVertices(8);
      const special = allVertices.slice(0, 3);
      const n = allVertices.length;
      const r = 1.0;
      const m = Math.floor(r * n);
      const maxEdges = nChoose2(n);
      expect(m).toBeLessThan(maxEdges); // sanity check on the chosen scenario

      const result = drainEdges(growEdgesStepwise(allVertices, special, r, DEFAULT_FIELD_SHAPE));
      expect(result.edges.length).toBe(Math.min(m, maxEdges));
    });

    it("edge count caps at n choose 2 when r implies more edges than possible", () => {
      const allVertices = makeVertices(5);
      const special = allVertices.slice(0, 2);
      const n = allVertices.length;
      const r = 1000.0;
      const m = Math.floor(r * n);
      const maxEdges = nChoose2(n);
      expect(m).toBeGreaterThan(maxEdges); // sanity check: r is deliberately oversized

      const result = drainEdges(growEdgesStepwise(allVertices, special, r, DEFAULT_FIELD_SHAPE));
      expect(result.edges.length).toBe(maxEdges);
    });
  });

  describe("TestNoSelfLoopsOrDuplicates", () => {
    it("no self-loop edges present", () => {
      const allVertices = makeVertices(6);
      const special = allVertices.slice(0, 2);
      const result = drainEdges(growEdgesStepwise(allVertices, special, 2.0, DEFAULT_FIELD_SHAPE));
      for (const [u, v] of result.edges) {
        expect(vertexKey(u)).not.toBe(vertexKey(v));
      }
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

      const result = drainEdges(growEdgesStepwise(allVertices, special, 1.5, DEFAULT_FIELD_SHAPE));
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
