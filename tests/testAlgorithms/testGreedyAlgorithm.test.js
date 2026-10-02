/**
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
  describe("acceptance order and stepwise yielding", () => {
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

  describe("an accepted pair is never yielded more than once", () => {
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

  describe("onAccept drives candidate reactivation", () => {
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

  describe("isStale discards stale candidates without accepting them", () => {
    // 5 vertices, custom priority table forces a fixed pop order (ties broken as listed)
    // (0,2) settles vertex 2 first; every later-popped pair targeting v=2 (or v=3, v=4
    // once settled) must be discarded by isStale, interleaved with still-valid pops
    function makeStaleScenario() {
      const allVertices = makeVertices(5);
      const priorityTable = new Map([
        ["0,1", 2],
        ["0,2", 1],
        ["0,3", 4],
        ["0,4", 6],
        ["1,2", 3],
        ["1,3", 7],
        ["1,4", 8],
        ["2,3", 5],
        ["2,4", 9],
        ["3,4", 10],
      ]);
      const priorityFn = (u, v) => priorityTable.get(`${u[0]},${v[0]}`);

      const settled = new Set();
      const onAccept = (u, v) => {
        settled.add(v[0]);
        return [];
      };
      const isStale = (u, v) => settled.has(v[0]);

      const terminationFn = terminationAfterUnions(allVertices, 4);

      return { allVertices, priorityFn, terminationFn, onAccept, isStale };
    }

    it("a candidate reported stale by isStale is never yielded", () => {
      const { allVertices, priorityFn, terminationFn, onAccept, isStale } = makeStaleScenario();

      const edges = [...growEdgesStepwise(allVertices, [], priorityFn, terminationFn, onAccept, isStale)];
      const keys = new Set(edges.map(edgeKey));

      // (1,2) and (2,3) pop after v=2/v=3 are already settled - must be discarded
      expect(keys.has(edgeKey([allVertices[1], allVertices[2]]))).toBe(false);
      expect(keys.has(edgeKey([allVertices[2], allVertices[3]]))).toBe(false);
    });

    it("keeps popping and accepting valid candidates after a stale discard", () => {
      const { allVertices, priorityFn, terminationFn, onAccept, isStale } = makeStaleScenario();

      const edges = [...growEdgesStepwise(allVertices, [], priorityFn, terminationFn, onAccept, isStale)];
      const keys = new Set(edges.map(edgeKey));

      // exactly the 4 star edges accepted; discards did not stall or end the run early
      expect(edges.length).toBe(4);
      expect(keys.has(edgeKey([allVertices[0], allVertices[3]]))).toBe(true);
      expect(keys.has(edgeKey([allVertices[0], allVertices[4]]))).toBe(true);
    });
  });
});
