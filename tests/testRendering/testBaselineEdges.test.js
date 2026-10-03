/** Static, always-visible background layer built from an optional edgeSet. */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../rendering/renderState.js";
import { computeGlow } from "../../rendering/glow.js";
import { EDGE_PACING_MILLISECONDS } from "../../rendering/renderer.js";
import { makeLinearEdgeSequence, makeVertices } from "./fixtures.js";

describe("Baseline edge-set layer", () => {
  describe("given an edgeSet, the baseline-edge list contains exactly its pairs", () => {
    it("reports every edgeSet pair as a baseline edge at step index 0", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);
      const edgeSet = [[0, 2], [2, 4], [1, 3]];

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        0,
        undefined,
        undefined,
        undefined,
        edgeSet,
      );

      expect(
        renderState.baselineEdges.map((edge) => [edge.startIndex, edge.endIndex]),
      ).toEqual(edgeSet);
    });

    it("reports baseline edges already present before any growth edge is accepted", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);
      const edgeSet = [[0, 3]];

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        0,
        undefined,
        undefined,
        undefined,
        edgeSet,
      );

      expect(renderState.visibleEdges).toEqual([]);
      expect(renderState.baselineEdges).toHaveLength(1);
    });
  });

  describe("no edgeSet given means no baseline layer, at any step", () => {
    it.each([0, 1, 2, 3])("reports an empty baseline-edge list at step index %i", (stepIndex) => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const renderState = computeRenderState(vertices, edgeSequence, stepIndex);

      expect(renderState.baselineEdges).toEqual([]);
    });
  });

  describe("the baseline-edge list is static as the step index advances", () => {
    it("reports exactly the same pairs at every step index", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);
      const edgeSet = [[0, 1], [2, 3]];

      const statesByStep = [0, 1, 2, 3, 4].map((stepIndex) =>
        computeRenderState(vertices, edgeSequence, stepIndex, undefined, undefined, undefined, edgeSet),
      );

      statesByStep.forEach((renderState) => {
        expect(
          renderState.baselineEdges.map((edge) => [edge.startIndex, edge.endIndex]),
        ).toEqual(edgeSet);
      });
    });

    it("stays unchanged even while currentTime/glow are supplied for the growth layer", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);
      const edgeSet = [[1, 3]];

      const early = computeRenderState(
        vertices,
        edgeSequence,
        2,
        0,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        edgeSet,
      );
      const late = computeRenderState(
        vertices,
        edgeSequence,
        2,
        20000,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        edgeSet,
      );

      expect(early.baselineEdges).toEqual(late.baselineEdges);
    });
  });

  describe("baseline edges carry no glow/timing data", () => {
    it("never attaches a glow field to a baseline edge", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);
      const edgeSet = [[0, 1]];

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        2,
        1000,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        edgeSet,
      );

      renderState.baselineEdges.forEach((edge) => {
        expect(edge).not.toHaveProperty("glow");
        expect(edge).not.toHaveProperty("becameVisibleAt");
      });
    });

    it("keeps baselineEdges and visibleEdges as separate lists, each with their own endpoints", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);
      const edgeSet = [[0, 4]];

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        2,
        0,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        edgeSet,
      );

      expect(renderState.baselineEdges).toHaveLength(1);
      expect(renderState.visibleEdges).toHaveLength(2);
      expect(renderState.baselineEdges[0]).toEqual({ startIndex: 0, endIndex: 4 });
    });
  });
});
