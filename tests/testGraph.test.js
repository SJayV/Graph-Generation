/** createGraph() reflects parameters.js's current values. */
import { afterEach, describe, expect, it, vi } from "vitest";

import * as parameters from "../parameters.js";

afterEach(() => {
  vi.doUnmock("../parameters.js");
  vi.resetModules();
});

describe("graph", () => {
  describe("TestCreateGraphReflectsParameters (AC2, AC6)", () => {
    it("createGraph samples exactly parameters.VERTEX_COUNT vertices", async () => {
      const { createGraph } = await import("../graph.js");
      const { allVertices } = createGraph();
      expect(allVertices.length).toBe(parameters.VERTEX_COUNT);
    });

    it("createGraph selects a special subset of exactly parameters.SPECIAL_SUBSET_SIZE vertices", async () => {
      const { createGraph } = await import("../graph.js");
      const { specialSubset } = createGraph();
      expect(specialSubset.length).toBe(parameters.SPECIAL_SUBSET_SIZE);
    });

    it("vertex count changes when parameters.VERTEX_COUNT is mocked to a different value (AC6)", async () => {
      vi.resetModules();
      vi.doMock("../parameters.js", async () => {
        const actual = await vi.importActual("../parameters.js");
        return { ...actual, VERTEX_COUNT: actual.VERTEX_COUNT + 17 };
      });

      const mockedParameters = await import("../parameters.js");
      const { createGraph } = await import("../graph.js");
      const { allVertices } = createGraph();

      expect(allVertices.length).toBe(mockedParameters.VERTEX_COUNT);
      expect(allVertices.length).not.toBe(parameters.VERTEX_COUNT);
    });

    it("special-subset size changes when parameters.SPECIAL_SUBSET_SIZE is mocked to a different value (AC6)", async () => {
      vi.resetModules();
      vi.doMock("../parameters.js", async () => {
        const actual = await vi.importActual("../parameters.js");
        return { ...actual, SPECIAL_SUBSET_SIZE: actual.SPECIAL_SUBSET_SIZE + 1 };
      });

      const mockedParameters = await import("../parameters.js");
      const { createGraph } = await import("../graph.js");
      const { specialSubset } = createGraph();

      expect(specialSubset.length).toBe(mockedParameters.SPECIAL_SUBSET_SIZE);
      expect(specialSubset.length).not.toBe(parameters.SPECIAL_SUBSET_SIZE);
    });
  });
});
