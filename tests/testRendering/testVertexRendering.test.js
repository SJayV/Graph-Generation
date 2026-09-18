/**
 * Tests for User Story 1 ("Grid Rendering of Vertices and Edges"),
 * category "Vertex rendering" (PLAN.md Assumptions A1-A2, Acceptance
 * Criterion 1).
 *
 * Assumed interface under test:
 *
 *   rendering/renderState.js
 *     computeRenderState(vertices, edgeSequence, stepIndex) -> RenderState
 *
 *   RenderState := {
 *     dots: Array<{ position: [number, number] }>,   // one per input vertex,
 *                                                    // same order as input
 *     visibleEdges: Array<{ startIndex: number, endIndex: number }>,
 *   }
 *
 * `dots[i].position` must equal `vertices[i]` exactly (A2): no
 * transformation, scaling, or recomputed layout is applied by the
 * render-state helper.
 */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../rendering/renderState.js";
import { makeVertices } from "./fixtures.js";

describe("Vertex rendering", () => {
  describe("A1: every vertex appears exactly once as a dot", () => {
    it("produces exactly one dot per input vertex", () => {
      const vertices = makeVertices(5);

      const renderState = computeRenderState(vertices, [], 0);

      expect(renderState.dots).toHaveLength(vertices.length);
    });

    it("produces no dots when the vertex list is empty", () => {
      const renderState = computeRenderState([], [], 0);

      expect(renderState.dots).toHaveLength(0);
    });

    it("does not duplicate a dot for a repeated vertex position query", () => {
      const vertices = [[0, 0], [1, 1], [2, 2]];

      const renderState = computeRenderState(vertices, [], 0);

      expect(renderState.dots).toHaveLength(3);
    });
  });

  describe("A2: a dot's position equals its input vertex's position exactly", () => {
    it("maps each vertex's coordinates onto its dot without transformation", () => {
      const vertices = [[0, 0], [3, 7], [10, 2]];

      const renderState = computeRenderState(vertices, [], 0);

      vertices.forEach((vertex, index) => {
        expect(renderState.dots[index].position).toEqual(vertex);
      });
    });

    it("preserves negative and large coordinates unchanged", () => {
      const vertices = [[-5, -5], [1000, 1000]];

      const renderState = computeRenderState(vertices, [], 0);

      expect(renderState.dots[0].position).toEqual([-5, -5]);
      expect(renderState.dots[1].position).toEqual([1000, 1000]);
    });

    it("does not recompute or normalize positions relative to each other", () => {
      const vertices = [[0, 0], [1, 0]];

      const renderState = computeRenderState(vertices, [], 0);

      // A recomputed/arbitrary layout (e.g. centering, normalizing to [0,1])
      // would change these raw values; the exact input values must survive.
      expect(renderState.dots[0].position).toEqual([0, 0]);
      expect(renderState.dots[1].position).toEqual([1, 0]);
    });
  });
});
