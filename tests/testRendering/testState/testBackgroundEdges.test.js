/** Static, always-visible background layer built from an optional edgeSet. */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../../rendering/state/renderState.js";
import { computeGlow } from "../../../rendering/state/glow.js";
import { EDGE_PACING_MILLISECONDS } from "../../../rendering/state/renderer.js";
import { makeLinearEdgeSequence, makeVertices } from "./fixtures.js";

function _backgroundEdges(renderState) {
  return renderState.edges.filter((edge) => edge.category === "background");
}

function _normalEdges(renderState) {
  return renderState.edges.filter((edge) => edge.category === "normal");
}

describe("Background edge-set layer", () => {
  describe("given an edgeSet, the background-edge list contains exactly its pairs", () => {
    it("reports every edgeSet pair as a background edge at step index 0", () => {
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
        _backgroundEdges(renderState).map((edge) => [edge.startIndex, edge.endIndex]),
      ).toEqual(edgeSet);
    });

    it("reports background edges already present before any growth edge is accepted", () => {
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

      expect(_normalEdges(renderState)).toEqual([]);
      expect(_backgroundEdges(renderState)).toHaveLength(1);
    });
  });

  describe("no edgeSet given means no background layer, at any step", () => {
    it.each([0, 1, 2, 3])("reports an empty background-edge list at step index %i", (stepIndex) => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const renderState = computeRenderState(vertices, edgeSequence, stepIndex);

      expect(_backgroundEdges(renderState)).toEqual([]);
    });
  });

  describe("the background-edge list is static as the step index advances", () => {
    it("reports exactly the same pairs at every step index", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);
      const edgeSet = [[0, 1], [2, 3]];

      const statesByStep = [0, 1, 2, 3, 4].map((stepIndex) =>
        computeRenderState(vertices, edgeSequence, stepIndex, undefined, undefined, undefined, edgeSet),
      );

      statesByStep.forEach((renderState) => {
        expect(
          _backgroundEdges(renderState).map((edge) => [edge.startIndex, edge.endIndex]),
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

      expect(_backgroundEdges(early)).toEqual(_backgroundEdges(late));
    });
  });

  describe("background edges carry no glow/timing data", () => {
    it("never attaches a glow field to a background edge", () => {
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

      _backgroundEdges(renderState).forEach((edge) => {
        expect(edge).not.toHaveProperty("glow");
        expect(edge).not.toHaveProperty("becameVisibleAt");
      });
    });

    it("keeps backgroundEdges and visibleEdges as separate lists, each with their own endpoints", () => {
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

      expect(_backgroundEdges(renderState)).toHaveLength(1);
      expect(_normalEdges(renderState)).toHaveLength(2);
      expect(_backgroundEdges(renderState)[0]).toEqual({ startIndex: 0, endIndex: 4, category: "background" });
    });
  });
});
