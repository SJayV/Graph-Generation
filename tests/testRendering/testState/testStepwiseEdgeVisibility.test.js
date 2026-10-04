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
    it("returns the first i entries index-for-index in original order", () => {
      const vertices = makeVertices(6);
      const edgeSequence = makeLinearEdgeSequence(6);
      const stepIndex = 3;

      const renderState = computeRenderState(makeRenderData(vertices, edgeSequence), stepIndex, 0, EDGE_PACING_MILLISECONDS);

      renderState.edges.forEach((visibleEdge, index) => {
        const [expectedStart, expectedEnd] = edgeSequence[index];
        expect(visibleEdge.startIndex).toBe(expectedStart);
        expect(visibleEdge.endIndex).toBe(expectedEnd);
      });
    });

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

  describe("step index 0 yields no visible edges but vertices remain present", () => {
    it("returns an empty visible-edge list at step 0", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const renderState = computeRenderState(makeRenderData(vertices, edgeSequence), 0, 0, EDGE_PACING_MILLISECONDS);

      expect(renderState.edges).toEqual([]);
    });

    it("still renders all vertices at step 0", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const renderState = computeRenderState(makeRenderData(vertices, edgeSequence), 0, 0, EDGE_PACING_MILLISECONDS);

      expect(renderState.vertices).toHaveLength(vertices.length);
    });
  });

  describe("step index equal to sequence length yields the entire sequence as visible edges", () => {
    it("matches the full edge sequence when stepIndex equals its length", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      const renderState = computeRenderState(makeRenderData(vertices, edgeSequence), edgeSequence.length, 0, EDGE_PACING_MILLISECONDS);

      expect(renderState.edges.map((edge) => [edge.startIndex, edge.endIndex])).toEqual(
        edgeSequence,
      );
    });

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

  describe("visibility is monotonic in the step index", () => {
    it("keeps every edge visible at step i also visible at every later step", () => {
      const vertices = makeVertices(6);
      const edgeSequence = makeLinearEdgeSequence(6);

      for (let stepIndex = 0; stepIndex < edgeSequence.length; stepIndex += 1) {
        const earlierState = computeRenderState(makeRenderData(vertices, edgeSequence), stepIndex, 0, EDGE_PACING_MILLISECONDS);
        const earlierEdgeKeys = new Set(
          earlierState.edges.map((edge) => `${edge.startIndex}-${edge.endIndex}`),
        );

        for (
          let laterStepIndex = stepIndex + 1;
          laterStepIndex <= edgeSequence.length;
          laterStepIndex += 1
        ) {
          const laterState = computeRenderState(makeRenderData(vertices, edgeSequence), laterStepIndex, 0, EDGE_PACING_MILLISECONDS);
          const laterEdgeKeys = new Set(
            laterState.edges.map((edge) => `${edge.startIndex}-${edge.endIndex}`),
          );

          earlierEdgeKeys.forEach((edgeKey) => {
            expect(laterEdgeKeys.has(edgeKey)).toBe(true);
          });
        }
      }
    });
  });

  describe("every visible edge's endpoints reference existing vertices", () => {
    it("has no dangling endpoints for any visible edge at any step", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      for (let stepIndex = 0; stepIndex <= edgeSequence.length; stepIndex += 1) {
        const renderState = computeRenderState(makeRenderData(vertices, edgeSequence), stepIndex, 0, EDGE_PACING_MILLISECONDS);

        renderState.edges.forEach((visibleEdge) => {
          expect(visibleEdge.startIndex).toBeGreaterThanOrEqual(0);
          expect(visibleEdge.startIndex).toBeLessThan(renderState.vertices.length);
          expect(visibleEdge.endIndex).toBeGreaterThanOrEqual(0);
          expect(visibleEdge.endIndex).toBeLessThan(renderState.vertices.length);
        });
      }
    });
  });
});
