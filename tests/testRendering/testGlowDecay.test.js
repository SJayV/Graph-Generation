/**
 * rendering/renderState.js: computeRenderState(vertices, edgeSequence, stepIndex, currentTime)
 * visibleEdges[i]: { startIndex, endIndex, becameVisibleAt, glow }
 * GLOW_COOLDOWN_MILLISECONDS: fixed cooldown constant
 */
import { describe, expect, it } from "vitest";

import { computeRenderState, GLOW_COOLDOWN_MILLISECONDS } from "../../rendering/renderState.js";
import { makeLinearEdgeSequence, makeVertices } from "./fixtures.js";

// becameVisibleAt is a property of the edge, not of the query time
function becameVisibleAtOf(vertices, edgeSequence, stepIndex, edgeIndex) {
  const state = computeRenderState(vertices, edgeSequence, stepIndex, 0);
  return state.visibleEdges[edgeIndex].becameVisibleAt;
}

function stripGlowFields(visibleEdges) {
  return visibleEdges.map(({ startIndex, endIndex }) => ({ startIndex, endIndex }));
}

describe("Glow decay", () => {
  describe("A15: glow bounded to [0.0, 1.0], 1.0 at became-visible time, 0.0 once cooldown elapsed", () => {
    it("reports glow 1.0 when currentTime equals the edge's became-visible time", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      const state = computeRenderState(vertices, edgeSequence, 2, becameVisibleAt);

      expect(state.visibleEdges[0].glow).toBe(1.0);
    });

    it("reports glow 0.0 exactly at became-visible time plus cooldown", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      const state = computeRenderState(
        vertices,
        edgeSequence,
        2,
        becameVisibleAt + GLOW_COOLDOWN_MILLISECONDS,
      );

      expect(state.visibleEdges[0].glow).toBe(0.0);
    });

    it("reports glow 0.0 for any currentTime beyond became-visible time plus cooldown", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      const state = computeRenderState(
        vertices,
        edgeSequence,
        2,
        becameVisibleAt + GLOW_COOLDOWN_MILLISECONDS * 10,
      );

      expect(state.visibleEdges[0].glow).toBe(0.0);
    });

    it("keeps glow strictly between 0.0 and 1.0 at arbitrary points inside the cooldown window", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      [0.1, 0.5, 0.9].forEach((fraction) => {
        const state = computeRenderState(
          vertices,
          edgeSequence,
          2,
          becameVisibleAt + GLOW_COOLDOWN_MILLISECONDS * fraction,
        );
        expect(state.visibleEdges[0].glow).toBeGreaterThan(0.0);
        expect(state.visibleEdges[0].glow).toBeLessThan(1.0);
      });
    });
  });

  describe("A16: in the cooldown's tail, glow trends toward 0.0 as elapsed time increases", () => {
    it("reports glow no greater for the elapsed time closer to expiry, near the tail", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      const nearerToExpiry = computeRenderState(
        vertices,
        edgeSequence,
        2,
        becameVisibleAt + GLOW_COOLDOWN_MILLISECONDS * 0.9,
      );
      const closerToExpiry = computeRenderState(
        vertices,
        edgeSequence,
        2,
        becameVisibleAt + GLOW_COOLDOWN_MILLISECONDS * 0.99,
      );

      expect(closerToExpiry.visibleEdges[0].glow).toBeLessThanOrEqual(
        nearerToExpiry.visibleEdges[0].glow,
      );
    });
  });

  describe("A17: cooldown duration is a single fixed constant across edges/graphs", () => {
    it("reports equal glow for two different edges at the same elapsed time", () => {
      const verticesA = makeVertices(3);
      const edgeSequenceA = makeLinearEdgeSequence(3);
      const verticesB = [[9, 9], [0, 0], [5, 3], [1, 1]];
      const edgeSequenceB = [[1, 0], [1, 3], [3, 2]];
      const elapsed = GLOW_COOLDOWN_MILLISECONDS * 0.5;

      const becameVisibleAtA = becameVisibleAtOf(verticesA, edgeSequenceA, 1, 0);
      const becameVisibleAtB = becameVisibleAtOf(verticesB, edgeSequenceB, 1, 0);

      const stateA = computeRenderState(verticesA, edgeSequenceA, 1, becameVisibleAtA + elapsed);
      const stateB = computeRenderState(verticesB, edgeSequenceB, 1, becameVisibleAtB + elapsed);

      expect(stateA.visibleEdges[0].glow).toBe(stateB.visibleEdges[0].glow);
    });

    it("does not shift the cooldown boundary with vertex/edge count", () => {
      const smallVertices = makeVertices(3);
      const smallEdgeSequence = makeLinearEdgeSequence(3);
      const largeVertices = makeVertices(20);
      const largeEdgeSequence = makeLinearEdgeSequence(20);

      const smallBecameVisibleAt = becameVisibleAtOf(smallVertices, smallEdgeSequence, 1, 0);
      const largeBecameVisibleAt = becameVisibleAtOf(largeVertices, largeEdgeSequence, 1, 0);

      const smallState = computeRenderState(
        smallVertices,
        smallEdgeSequence,
        1,
        smallBecameVisibleAt + GLOW_COOLDOWN_MILLISECONDS,
      );
      const largeState = computeRenderState(
        largeVertices,
        largeEdgeSequence,
        1,
        largeBecameVisibleAt + GLOW_COOLDOWN_MILLISECONDS,
      );

      expect(smallState.visibleEdges[0].glow).toBe(0.0);
      expect(largeState.visibleEdges[0].glow).toBe(0.0);
    });
  });

  describe("A18: glow is purely visual, never affects the visible-edge set/order", () => {
    it("keeps a fully cooled-down edge (glow 0.0) present in the visible-edge list", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      const state = computeRenderState(
        vertices,
        edgeSequence,
        2,
        becameVisibleAt + GLOW_COOLDOWN_MILLISECONDS,
      );

      expect(state.visibleEdges).toHaveLength(2);
      expect(state.visibleEdges[0].glow).toBe(0.0);
    });

    it("matches the Story 1 visible-edge set/order regardless of currentTime", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const story1State = computeRenderState(vertices, edgeSequence, 3);
      const glowStateEarly = computeRenderState(vertices, edgeSequence, 3, 0);
      const glowStateLate = computeRenderState(vertices, edgeSequence, 3, GLOW_COOLDOWN_MILLISECONDS * 100);

      expect(stripGlowFields(glowStateEarly.visibleEdges)).toEqual(
        stripGlowFields(story1State.visibleEdges),
      );
      expect(stripGlowFields(glowStateLate.visibleEdges)).toEqual(
        stripGlowFields(story1State.visibleEdges),
      );
    });
  });

  describe("A19: fully-elapsed cooldown state matches Story 1's state aside from glow fields", () => {
    it("matches dots exactly when every visible edge's cooldown has elapsed", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      const story1State = computeRenderState(vertices, edgeSequence, edgeSequence.length);
      const farFutureTime = GLOW_COOLDOWN_MILLISECONDS * 1000;
      const glowState = computeRenderState(vertices, edgeSequence, edgeSequence.length, farFutureTime);

      expect(glowState.dots).toEqual(story1State.dots);
    });

    it("matches the visible-edge list exactly, aside from the added glow fields", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      const story1State = computeRenderState(vertices, edgeSequence, edgeSequence.length);
      const farFutureTime = GLOW_COOLDOWN_MILLISECONDS * 1000;
      const glowState = computeRenderState(vertices, edgeSequence, edgeSequence.length, farFutureTime);

      expect(stripGlowFields(glowState.visibleEdges)).toEqual(
        stripGlowFields(story1State.visibleEdges),
      );
      glowState.visibleEdges.forEach((edge) => {
        expect(edge.glow).toBe(0.0);
      });
    });
  });
});
