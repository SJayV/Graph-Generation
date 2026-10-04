/** createGraph() reflects parameters.js's current values. */
import { afterEach, describe, expect, it, vi } from "vitest";

import { SPECIAL_SUBSET_SIZE, VERTEX_COUNT } from "../parameters.js";

afterEach(() => {
  vi.doUnmock("../parameters.js");
  vi.resetModules();
});

describe("graph", () => {
  describe("TestCreateGraphReflectsParameters (AC2, AC6)", () => {
    it("createGraph samples exactly parameters.VERTEX_COUNT vertices", async () => {
      const { createGraph } = await import("../graph.js");
      const { allVertices } = createGraph();
      expect(allVertices.length).toBe(VERTEX_COUNT);
    });

    it("createGraph selects a special subset of exactly parameters.SPECIAL_SUBSET_SIZE vertices", async () => {
      const { createGraph } = await import("../graph.js");
      const { specialSubset } = createGraph();
      expect(specialSubset.length).toBe(SPECIAL_SUBSET_SIZE);
    });
  });

  describe("TestCreateGraphReflectsAppliedParameters (AC8, FR16)", () => {
    it("createGraph returns the new vertex count after setParameters, without reloading modules", async () => {
      vi.resetModules();
      const liveParameters = await import("../parameters.js");
      const { createGraph } = await import("../graph.js");
      const originalVertexCount = liveParameters.VERTEX_COUNT;
      const newVertexCount = originalVertexCount + 17;

      try {
        liveParameters.setParameters({ vertexCount: newVertexCount });
        expect(createGraph().allVertices.length).toBe(newVertexCount);
      } finally {
        liveParameters.setParameters({ vertexCount: originalVertexCount });
      }
    });
  });
});
