/**
 * algorithms/greedyAlgorithm.js: growEdgesStepwise(allVertices, specialSubset, priorityFn, terminationFn, onAccept)
 * generic accept/union/reactivate skeleton; priorityFn(u, v, dsu) -> number, smaller = popped first
 * terminationFn(dsu) -> boolean, checked before popping the next candidate
 * synthetic priority/termination here on purpose - contract is algorithm-agnostic
 */
import { describe, expect, it } from "vitest";

import { growEdgesStepwise } from "../../algorithms/greedyAlgorithm.js";

function makeVertices(n) {
  return Array.from({ length: n }, (_, i) => [i, 0]);
}

function edgeKey([u, v]) {
  const [a, b] = [`${u[0]},${u[1]}`, `${v[0]},${v[1]}`].sort();
  return `${a}|${b}`;
}

// stop once exactly k unions have happened, regardless of specialSubset
function terminationAfterUnions(allVertices, k) {
  return (dsu) => dsu.componentCount() <= allVertices.length - k;
}

describe("greedyAlgorithm", () => {
  describe("AC1: acceptance order and stepwise yielding", () => {
    it("yields accepted edges one at a time, in non-decreasing priority order", () => {
      const allVertices = makeVertices(6);
      const priorityFn = (u, v) => u[0] + v[0];
      const terminationFn = terminationAfterUnions(allVertices, 4);

      const priorities = [];
      for (const [u, v] of growEdgesStepwise(allVertices, [], priorityFn, terminationFn)) {
        priorities.push(priorityFn(u, v));
      }

      for (let i = 1; i < priorities.length; i += 1) {
        expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i - 1]);
      }
    });

    it("stops as soon as the termination predicate is satisfied", () => {
      const allVertices = makeVertices(6);
      const priorityFn = (u, v) => u[0] + v[0];
      const terminationFn = terminationAfterUnions(allVertices, 3);

      const edges = [...growEdgesStepwise(allVertices, [], priorityFn, terminationFn)];

      expect(edges.length).toBe(3);
    });

    it("yields nothing when the termination predicate already holds", () => {
      const allVertices = makeVertices(4);
      const priorityFn = (u, v) => u[0] + v[0];

      const edges = [...growEdgesStepwise(allVertices, [], priorityFn, () => true)];

      expect(edges).toEqual([]);
    });
  });

  describe("A2: an accepted pair is never yielded more than once", () => {
    it("has no repeated unordered pairs across a long run", () => {
      const allVertices = makeVertices(8);
      const priorityFn = (u, v) => Math.abs(u[0] - v[0]);
      const terminationFn = terminationAfterUnions(allVertices, allVertices.length - 1);

      const seen = new Set();
      for (const edge of growEdgesStepwise(allVertices, [], priorityFn, terminationFn)) {
        const key = edgeKey(edge);
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
  });

  describe("A3: onAccept drives candidate reactivation", () => {
    // priorityFn is asymmetric: only finite for pairs whose 'u' side is already reachable
    // mirrors Dijkstra needing dist[u] finalized before priorityFn(u, v) is meaningful
    it("without onAccept, pairs scored Infinity at heap-build time stay unreachable", () => {
      const allVertices = makeVertices(5);
      const reachable = new Set([2]);
      const priorityFn = (u, v) => (reachable.has(u[0]) ? u[0] + v[0] : Infinity);
      const terminationFn = terminationAfterUnions(allVertices, 2);

      const edges = [...growEdgesStepwise(allVertices, [], priorityFn, terminationFn)];
      const touched = new Set(edges.flatMap(([u, v]) => [u[0], v[0]]));

      expect(touched.has(0)).toBe(false);
      expect(touched.has(1)).toBe(false);
    });

    it("with onAccept, freshly-scored reactivated pairs reach every vertex", () => {
      const allVertices = makeVertices(5);
      const reachable = new Set([2]);
      const priorityFn = (u, v) => (reachable.has(u[0]) ? u[0] + v[0] : Infinity);
      const onAccept = (u, v) => {
        reachable.add(u[0]);
        reachable.add(v[0]);
        return allVertices.filter((w) => w[0] !== v[0]).map((w) => [v, w]);
      };
      const terminationFn = terminationAfterUnions(allVertices, 4);

      const edges = [...growEdgesStepwise(allVertices, [], priorityFn, terminationFn, onAccept)];
      const touched = new Set(edges.flatMap(([u, v]) => [u[0], v[0]]));

      expect(touched.size).toBe(5);
    });
  });
});
