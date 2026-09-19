/**
 * logic/vertices.js: sampleVertices, selectSpecialSubset
 * logic/rng.js: createSeededRng
 */
import { beforeEach, describe, expect, it } from "vitest";

import { createSeededRng } from "../../logic/rng.js";
import { sampleVertices, selectSpecialSubset } from "../../logic/vertices.js";

// A fresh, deterministically seeded RNG, isolated per test (JS
// equivalent of the Python "rng" pytest fixture in conftest.py).
const RNG_SEED = 1234;

function toKey([x, y]) {
  return `${x},${y}`;
}

function toKeySet(vertexList) {
  return new Set(vertexList.map(toKey));
}

describe("sampleVertices", () => {
  let rng;

  beforeEach(() => {
    rng = createSeededRng(RNG_SEED);
  });

  describe("TestVertexCount", () => {
    it("returns exactly n vertices", () => {
      const n = 10;
      const L = 20;

      const result = sampleVertices(n, L, rng);

      expect(result).toHaveLength(n);
    });

    it("with minimal n returns one vertex", () => {
      const result = sampleVertices(1, 5, rng);

      expect(result).toHaveLength(1);
    });
  });

  describe("TestGridCapacity", () => {
    it("rejects n larger than grid capacity", () => {
      const L = 2; // grid has (L + 1) ** 2 == 9 points

      expect(() => sampleVertices(10, L, rng)).toThrow();
    });

    it("accepts n equal to grid capacity", () => {
      const L = 2;
      const n = (L + 1) ** 2;

      const result = sampleVertices(n, L, rng);

      expect(result).toHaveLength(n);
    });
  });

  describe("TestUniqueness", () => {
    it("produces pairwise distinct coordinates", () => {
      const n = 50;
      const L = 30;

      const result = sampleVertices(n, L, rng);

      expect(toKeySet(result).size).toBe(result.length);
    });

    it("is deterministic given same seeded rng", () => {
      const firstRun = sampleVertices(20, 15, createSeededRng(42));
      const secondRun = sampleVertices(20, 15, createSeededRng(42));

      expect(firstRun).toEqual(secondRun);
    });
  });

  describe("TestCoordinateDomain", () => {
    it("returns coordinates within grid bounds", () => {
      const n = 30;
      const L = 12;

      const result = sampleVertices(n, L, rng);

      result.forEach(([x, y]) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(L);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(L);
      });
    });

    it("returns integer coordinates", () => {
      const result = sampleVertices(15, 10, rng);

      result.forEach(([x, y]) => {
        expect(Number.isInteger(x)).toBe(true);
        expect(Number.isInteger(y)).toBe(true);
      });
    });
  });
});

describe("selectSpecialSubset", () => {
  let rng;
  let sampledVertices;

  beforeEach(() => {
    rng = createSeededRng(RNG_SEED);
    sampledVertices = sampleVertices(20, 15, createSeededRng(7));
  });

  describe("TestSubsetMembership", () => {
    it("has all members belonging to the vertex set", () => {
      const k = 5;

      const subset = selectSpecialSubset(sampledVertices, k, rng);

      const allowedKeys = toKeySet(sampledVertices);
      subset.forEach((vertex) => {
        expect(allowedKeys.has(toKey(vertex))).toBe(true);
      });
    });
  });

  describe("TestSubsetSize", () => {
    it("returns the requested size", () => {
      const k = 6;

      const subset = selectSpecialSubset(sampledVertices, k, rng);

      expect(subset).toHaveLength(k);
    });

    it("allows k equal to zero", () => {
      const subset = selectSpecialSubset(sampledVertices, 0, rng);

      expect(subset).toEqual([]);
    });

    it("allows k equal to n", () => {
      const n = sampledVertices.length;

      const subset = selectSpecialSubset(sampledVertices, n, rng);

      expect(subset).toHaveLength(n);
    });

    it("rejects k greater than n", () => {
      const n = sampledVertices.length;

      expect(() => selectSpecialSubset(sampledVertices, n + 1, rng)).toThrow();
    });

    it("rejects negative k", () => {
      expect(() => selectSpecialSubset(sampledVertices, -1, rng)).toThrow();
    });
  });

  describe("TestNoDuplicates", () => {
    it("has no duplicate members", () => {
      const k = 8;

      const subset = selectSpecialSubset(sampledVertices, k, rng);

      expect(toKeySet(subset).size).toBe(subset.length);
    });
  });
});
