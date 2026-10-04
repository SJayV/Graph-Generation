import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../../rendering/state/renderState.js";
import { EDGE_PACING_MILLISECONDS } from "../../../parameters.js";
import { makeRenderData, makeVertices } from "./fixtures.js";

describe("Vertex rendering", () => {
  describe("every vertex appears exactly once in the rendered vertex list", () => {
    it("produces exactly one rendered vertex per input vertex", () => {
      const vertices = makeVertices(5);

      const renderState = computeRenderState(makeRenderData(vertices, []), 0, 0, EDGE_PACING_MILLISECONDS);

      expect(renderState.vertices).toHaveLength(vertices.length);
    });

    it("produces no rendered vertices when the vertex list is empty", () => {
      const renderState = computeRenderState(makeRenderData([], []), 0, 0, EDGE_PACING_MILLISECONDS);

      expect(renderState.vertices).toHaveLength(0);
    });
  });

  describe("a rendered vertex's position equals its input vertex's position exactly", () => {
    it("maps each vertex's coordinates onto its rendered vertex without transformation", () => {
      const vertices = [[0, 0], [3, 7], [10, 2]];

      const renderState = computeRenderState(makeRenderData(vertices, []), 0, 0, EDGE_PACING_MILLISECONDS);

      vertices.forEach((vertex, index) => {
        expect(renderState.vertices[index].position).toEqual(vertex);
      });
    });

    it("preserves negative and large coordinates unchanged", () => {
      const vertices = [[-5, -5], [1000, 1000]];

      const renderState = computeRenderState(makeRenderData(vertices, []), 0, 0, EDGE_PACING_MILLISECONDS);

      expect(renderState.vertices[0].position).toEqual([-5, -5]);
      expect(renderState.vertices[1].position).toEqual([1000, 1000]);
    });
  });
});
