/**
 * rendering/renderState.js: computeRenderState, stepwise edge visibility
 * edgeSequence entries: [startIndex, endIndex] into vertices
 */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../rendering/renderState.js";
import { makeLinearEdgeSequence, makeVertices } from "./fixtures.js";

describe("Stepwise edge visibility", () => {
  describe("A3: visible-edge count equals the step index i exactly", () => {
    it.each([0, 1, 2, 3, 4])(
      "reports exactly %i visible edges at step index %i",
      (stepIndex) => {
        const vertices = makeVertices(5);
        const edgeSequence = makeLinearEdgeSequence(5);

        const renderState = computeRenderState(vertices, edgeSequence, stepIndex);

        expect(renderState.visibleEdges).toHaveLength(stepIndex);
      },
    );
  });

  describe("A4: visible edges preserve the input sequence's order", () => {
    it("returns the first i entries index-for-index in original order", () => {
      const vertices = makeVertices(6);
      const edgeSequence = makeLinearEdgeSequence(6);
      const stepIndex = 3;

      const renderState = computeRenderState(vertices, edgeSequence, stepIndex);

      renderState.visibleEdges.forEach((visibleEdge, index) => {
        const [expectedStart, expectedEnd] = edgeSequence[index];
        expect(visibleEdge.startIndex).toBe(expectedStart);
        expect(visibleEdge.endIndex).toBe(expectedEnd);
      });
    });

    it("does not reorder edges even if a later edge could look earlier", () => {
      const vertices = makeVertices(4);
      // Deliberately not sorted by index to check no implicit re-sorting.
      const edgeSequence = [[2, 3], [0, 1], [1, 2]];

      const renderState = computeRenderState(vertices, edgeSequence, 3);

      expect(renderState.visibleEdges.map((edge) => [edge.startIndex, edge.endIndex])).toEqual(
        edgeSequence,
      );
    });
  });

  describe("A5: i = 0 yields no visible edges but vertex dots remain present", () => {
    it("returns an empty visible-edge list at step 0", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const renderState = computeRenderState(vertices, edgeSequence, 0);

      expect(renderState.visibleEdges).toEqual([]);
    });

    it("still renders all vertex dots at step 0", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const renderState = computeRenderState(vertices, edgeSequence, 0);

      expect(renderState.dots).toHaveLength(vertices.length);
    });
  });

  describe("A6: i = length yields the entire sequence as visible edges", () => {
    it("matches the full edge sequence when stepIndex equals its length", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      const renderState = computeRenderState(vertices, edgeSequence, edgeSequence.length);

      expect(renderState.visibleEdges.map((edge) => [edge.startIndex, edge.endIndex])).toEqual(
        edgeSequence,
      );
    });

    it("connects the correct pair of vertex dots by rendered position for every edge", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      const renderState = computeRenderState(vertices, edgeSequence, edgeSequence.length);

      renderState.visibleEdges.forEach((visibleEdge, index) => {
        const [expectedStartIndex, expectedEndIndex] = edgeSequence[index];
        expect(renderState.dots[visibleEdge.startIndex].position).toEqual(
          vertices[expectedStartIndex],
        );
        expect(renderState.dots[visibleEdge.endIndex].position).toEqual(
          vertices[expectedEndIndex],
        );
      });
    });
  });

  describe("A7: visibility is monotonic in i", () => {
    it("keeps every edge visible at step i also visible at every later step", () => {
      const vertices = makeVertices(6);
      const edgeSequence = makeLinearEdgeSequence(6);

      for (let stepIndex = 0; stepIndex < edgeSequence.length; stepIndex += 1) {
        const earlierState = computeRenderState(vertices, edgeSequence, stepIndex);
        const earlierEdgeKeys = new Set(
          earlierState.visibleEdges.map((edge) => `${edge.startIndex}-${edge.endIndex}`),
        );

        for (
          let laterStepIndex = stepIndex + 1;
          laterStepIndex <= edgeSequence.length;
          laterStepIndex += 1
        ) {
          const laterState = computeRenderState(vertices, edgeSequence, laterStepIndex);
          const laterEdgeKeys = new Set(
            laterState.visibleEdges.map((edge) => `${edge.startIndex}-${edge.endIndex}`),
          );

          earlierEdgeKeys.forEach((edgeKey) => {
            expect(laterEdgeKeys.has(edgeKey)).toBe(true);
          });
        }
      }
    });
  });

  describe("A8: every visible edge's endpoints reference existing vertex dots", () => {
    it("has no dangling endpoints for any visible edge at any step", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      for (let stepIndex = 0; stepIndex <= edgeSequence.length; stepIndex += 1) {
        const renderState = computeRenderState(vertices, edgeSequence, stepIndex);

        renderState.visibleEdges.forEach((visibleEdge) => {
          expect(visibleEdge.startIndex).toBeGreaterThanOrEqual(0);
          expect(visibleEdge.startIndex).toBeLessThan(renderState.dots.length);
          expect(visibleEdge.endIndex).toBeGreaterThanOrEqual(0);
          expect(visibleEdge.endIndex).toBeLessThan(renderState.dots.length);
        });
      }
    });
  });
});
