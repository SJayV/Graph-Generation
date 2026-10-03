import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../../rendering/state/renderState.js";
import { makeVertices } from "./fixtures.js";

describe("Vertex rendering", () => {
  describe("every vertex appears exactly once in the rendered vertex list", () => {
    it("produces exactly one rendered vertex per input vertex", () => {
      const vertices = makeVertices(5);

      const renderState = computeRenderState(vertices, [], 0);

      expect(renderState.vertices).toHaveLength(vertices.length);
    });

    it("produces no rendered vertices when the vertex list is empty", () => {
      const renderState = computeRenderState([], [], 0);

      expect(renderState.vertices).toHaveLength(0);
    });

    it("does not duplicate a rendered vertex for a repeated vertex position query", () => {
      const vertices = [[0, 0], [1, 1], [2, 2]];

      const renderState = computeRenderState(vertices, [], 0);

      expect(renderState.vertices).toHaveLength(3);
    });
  });

  describe("a rendered vertex's position equals its input vertex's position exactly", () => {
    it("maps each vertex's coordinates onto its rendered vertex without transformation", () => {
      const vertices = [[0, 0], [3, 7], [10, 2]];

      const renderState = computeRenderState(vertices, [], 0);

      vertices.forEach((vertex, index) => {
        expect(renderState.vertices[index].position).toEqual(vertex);
      });
    });

    it("preserves negative and large coordinates unchanged", () => {
      const vertices = [[-5, -5], [1000, 1000]];

      const renderState = computeRenderState(vertices, [], 0);

      expect(renderState.vertices[0].position).toEqual([-5, -5]);
      expect(renderState.vertices[1].position).toEqual([1000, 1000]);
    });

    it("does not recompute or normalize positions relative to each other", () => {
      const vertices = [[0, 0], [1, 0]];

      const renderState = computeRenderState(vertices, [], 0);

      // A recomputed/arbitrary layout (e.g. centering, normalizing to [0,1])
      // would change these raw values; the exact input values must survive.
      expect(renderState.vertices[0].position).toEqual([0, 0]);
      expect(renderState.vertices[1].position).toEqual([1, 0]);
    });
  });
});
