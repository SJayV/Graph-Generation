/**
 * edgeSequence entries: [startIndex, endIndex] into vertices
 */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../../rendering/state/renderState.js";
import { EDGE_PACING_MILLISECONDS } from "../../../parameters.js";
import { makeLinearEdgeSequence, makeRenderData, makeVertices } from "./fixtures.js";

describe("Stepwise edge visibility", () => {
  describe("visible-edge count equals the step index exactly", () => {
    it.each([0, 1, 2, 3, 4])(
      "reports exactly %i visible edges at step index %i",
      (stepIndex) => {
        const vertices = makeVertices(5);
        const edgeSequence = makeLinearEdgeSequence(5);

        const renderState = computeRenderState(makeRenderData(vertices, edgeSequence), stepIndex, 0, EDGE_PACING_MILLISECONDS);

        expect(renderState.edges).toHaveLength(stepIndex);
      },
    );
  });

  describe("visible edges preserve the input sequence's order", () => {
    it("does not reorder edges even if a later edge could look earlier", () => {
      const vertices = makeVertices(4);
      // Deliberately not sorted by index to check no implicit re-sorting.
      const edgeSequence = [[2, 3], [0, 1], [1, 2]];

      const renderState = computeRenderState(makeRenderData(vertices, edgeSequence), 3, 0, EDGE_PACING_MILLISECONDS);

      expect(renderState.edges.map((edge) => [edge.startIndex, edge.endIndex])).toEqual(
        edgeSequence,
      );
    });
  });

  describe("step index equal to sequence length yields the entire sequence as visible edges", () => {
    it("connects the correct pair of vertices by rendered position for every edge", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      const renderState = computeRenderState(makeRenderData(vertices, edgeSequence), edgeSequence.length, 0, EDGE_PACING_MILLISECONDS);

      renderState.edges.forEach((visibleEdge, index) => {
        const [expectedStartIndex, expectedEndIndex] = edgeSequence[index];
        expect(renderState.vertices[visibleEdge.startIndex].position).toEqual(
          vertices[expectedStartIndex],
        );
        expect(renderState.vertices[visibleEdge.endIndex].position).toEqual(
          vertices[expectedEndIndex],
        );
      });
    });
  });
});
