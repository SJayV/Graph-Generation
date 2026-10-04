/** Static, always-visible background layer built from the edgeSet. */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../../rendering/state/renderState.js";
import { EDGE_PACING_MILLISECONDS } from "../../../parameters.js";
import { makeLinearEdgeSequence, makeRenderData, makeVertices } from "./fixtures.js";

function _backgroundEdges(renderState) {
  return renderState.edges.filter((edge) => edge.category === "background");
}

function _normalEdges(renderState) {
  return renderState.edges.filter((edge) => edge.category === "normal");
}

function _stateAt(vertices, edgeSequence, edgeSet, stepIndex, currentTime = 0) {
  return computeRenderState(
    makeRenderData(vertices, edgeSequence, { edgeSet }),
    stepIndex,
    currentTime,
    EDGE_PACING_MILLISECONDS,
  );
}

describe("Background edge-set layer", () => {
  describe("given an edgeSet, the background-edge list contains exactly its pairs", () => {
    it("reports every edgeSet pair as a background edge at step index 0", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);
      const edgeSet = [[0, 2], [2, 4], [1, 3]];

      const renderState = _stateAt(vertices, edgeSequence, edgeSet, 0);

      expect(
        _backgroundEdges(renderState).map((edge) => [edge.startIndex, edge.endIndex]),
      ).toEqual(edgeSet);
    });

    it("reports background edges already present before any growth edge is accepted", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);
      const edgeSet = [[0, 3]];

      const renderState = _stateAt(vertices, edgeSequence, edgeSet, 0);

      expect(_normalEdges(renderState)).toEqual([]);
      expect(_backgroundEdges(renderState)).toHaveLength(1);
    });
  });

  describe("an empty edgeSet means no background layer, at any step", () => {
    it.each([0, 1, 2, 3])("reports an empty background-edge list at step index %i", (stepIndex) => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const renderState = _stateAt(vertices, edgeSequence, [], stepIndex);

      expect(_backgroundEdges(renderState)).toEqual([]);
    });
  });

  describe("the background-edge list is static as the step index advances", () => {
    it("reports exactly the same pairs at every step index", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);
      const edgeSet = [[0, 1], [2, 3]];

      const statesByStep = [0, 1, 2, 3, 4].map((stepIndex) =>
        _stateAt(vertices, edgeSequence, edgeSet, stepIndex),
      );

      statesByStep.forEach((renderState) => {
        expect(
          _backgroundEdges(renderState).map((edge) => [edge.startIndex, edge.endIndex]),
        ).toEqual(edgeSet);
      });
    });

    it("stays unchanged as currentTime (and so growth-edge glow) changes", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);
      const edgeSet = [[1, 3]];

      const early = _stateAt(vertices, edgeSequence, edgeSet, 2, 0);
      const late = _stateAt(vertices, edgeSequence, edgeSet, 2, 20000);

      expect(_backgroundEdges(early)).toEqual(_backgroundEdges(late));
    });
  });

  describe("background edges carry no glow/timing data", () => {
    it("keeps background and normal edges distinguishable, each with their own endpoints", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);
      const edgeSet = [[0, 4]];

      const renderState = _stateAt(vertices, edgeSequence, edgeSet, 2);

      expect(_backgroundEdges(renderState)).toHaveLength(1);
      expect(_normalEdges(renderState)).toHaveLength(2);
      expect(_backgroundEdges(renderState)[0]).toEqual({ startIndex: 0, endIndex: 4, category: "background" });
    });
  });
});
