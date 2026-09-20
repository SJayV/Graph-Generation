/**
 * rendering/renderState.js: computeRenderState(vertices, edgeSequence, stepIndex, currentTime)
 * visibleEdges[i]: { startIndex, endIndex, becameVisibleAt, glow }
 * No fixed cooldown: glow decays asymptotically, approaching but never reaching 0.0
 */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../rendering/renderState.js";
import { computeGlow } from "../../rendering/glow.js";
import { EDGE_PACING_MILLISECONDS } from "../../rendering/renderer.js";
import { makeLinearEdgeSequence, makeVertices } from "./fixtures.js";

const LARGE_ELAPSED = 5000;
const LARGER_ELAPSED = 20000;
const EPSILON = 0.01;

// becameVisibleAt is a property of the edge, not of the query time
function becameVisibleAtOf(vertices, edgeSequence, stepIndex, edgeIndex) {
  const state = computeRenderState(vertices, edgeSequence, stepIndex, 0, computeGlow, EDGE_PACING_MILLISECONDS);
  return state.visibleEdges[edgeIndex].becameVisibleAt;
}

function stripGlowFields(visibleEdges) {
  return visibleEdges.map(({ startIndex, endIndex }) => ({ startIndex, endIndex }));
}

describe("Glow decay", () => {
  describe("A15: glow is 1.0 at elapsed time 0, strictly within (0.0, 1.0) otherwise", () => {
    it("reports glow 1.0 when currentTime equals the edge's became-visible time", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      const state = computeRenderState(vertices, edgeSequence, 2, becameVisibleAt, computeGlow, EDGE_PACING_MILLISECONDS);

      expect(state.visibleEdges[0].glow).toBe(1.0);
    });

    it("keeps glow strictly between 0.0 and 1.0 for any positive elapsed time", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      [1, 1000, LARGE_ELAPSED, LARGER_ELAPSED].forEach((elapsed) => {
        const state = computeRenderState(vertices, edgeSequence, 2, becameVisibleAt + elapsed, computeGlow, EDGE_PACING_MILLISECONDS);
        expect(state.visibleEdges[0].glow).toBeGreaterThan(0.0);
        expect(state.visibleEdges[0].glow).toBeLessThan(1.0);
      });
    });
  });

  describe("A16: glow gets arbitrarily close to 0.0 for large enough elapsed time", () => {
    it("drops below a small threshold at a very large elapsed time", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      const state = computeRenderState(vertices, edgeSequence, 2, becameVisibleAt + LARGER_ELAPSED, computeGlow, EDGE_PACING_MILLISECONDS);

      expect(state.visibleEdges[0].glow).toBeLessThan(EPSILON);
    });
  });

  describe("A17: in the tail, glow trends toward 0.0 as elapsed time increases", () => {
    it("reports glow no greater for the larger of two elapsed times, both deep in the tail", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      const lessElapsed = computeRenderState(vertices, edgeSequence, 2, becameVisibleAt + LARGE_ELAPSED, computeGlow, EDGE_PACING_MILLISECONDS);
      const moreElapsed = computeRenderState(vertices, edgeSequence, 2, becameVisibleAt + LARGER_ELAPSED, computeGlow, EDGE_PACING_MILLISECONDS);

      expect(moreElapsed.visibleEdges[0].glow).toBeLessThanOrEqual(lessElapsed.visibleEdges[0].glow);
    });
  });

  describe("A18: decay curve is a single fixed function across edges/graphs", () => {
    it("reports equal glow for two different edges at the same elapsed time", () => {
      const verticesA = makeVertices(3);
      const edgeSequenceA = makeLinearEdgeSequence(3);
      const verticesB = [[9, 9], [0, 0], [5, 3], [1, 1]];
      const edgeSequenceB = [[1, 0], [1, 3], [3, 2]];
      const elapsed = LARGE_ELAPSED;

      const becameVisibleAtA = becameVisibleAtOf(verticesA, edgeSequenceA, 1, 0);
      const becameVisibleAtB = becameVisibleAtOf(verticesB, edgeSequenceB, 1, 0);

      const stateA = computeRenderState(verticesA, edgeSequenceA, 1, becameVisibleAtA + elapsed, computeGlow, EDGE_PACING_MILLISECONDS);
      const stateB = computeRenderState(verticesB, edgeSequenceB, 1, becameVisibleAtB + elapsed, computeGlow, EDGE_PACING_MILLISECONDS);

      expect(stateA.visibleEdges[0].glow).toBe(stateB.visibleEdges[0].glow);
    });

    it("does not vary with vertex/edge count at the same elapsed time", () => {
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
        smallBecameVisibleAt + LARGE_ELAPSED,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
      );
      const largeState = computeRenderState(
        largeVertices,
        largeEdgeSequence,
        1,
        largeBecameVisibleAt + LARGE_ELAPSED,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
      );

      expect(smallState.visibleEdges[0].glow).toBe(largeState.visibleEdges[0].glow);
    });
  });

  describe("A19: glow is purely visual, never affects the visible-edge set/order", () => {
    it("keeps a negligible-glow edge present in the visible-edge list", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const becameVisibleAt = becameVisibleAtOf(vertices, edgeSequence, 2, 0);

      const state = computeRenderState(vertices, edgeSequence, 2, becameVisibleAt + LARGER_ELAPSED, computeGlow, EDGE_PACING_MILLISECONDS);

      expect(state.visibleEdges).toHaveLength(2);
      expect(state.visibleEdges[0].glow).toBeLessThan(EPSILON);
    });

    it("matches the Story 1 visible-edge set/order regardless of currentTime", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const story1State = computeRenderState(vertices, edgeSequence, 3);
      const glowStateEarly = computeRenderState(vertices, edgeSequence, 3, 0, computeGlow, EDGE_PACING_MILLISECONDS);
      const glowStateLate = computeRenderState(vertices, edgeSequence, 3, LARGER_ELAPSED, computeGlow, EDGE_PACING_MILLISECONDS);

      expect(stripGlowFields(glowStateEarly.visibleEdges)).toEqual(
        stripGlowFields(story1State.visibleEdges),
      );
      expect(stripGlowFields(glowStateLate.visibleEdges)).toEqual(
        stripGlowFields(story1State.visibleEdges),
      );
    });
  });

  describe("A20: negligible-glow state matches Story 1's state aside from glow fields", () => {
    it("matches dots exactly at a very large currentTime", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      const story1State = computeRenderState(vertices, edgeSequence, edgeSequence.length);
      const glowState = computeRenderState(vertices, edgeSequence, edgeSequence.length, LARGER_ELAPSED, computeGlow, EDGE_PACING_MILLISECONDS);

      expect(glowState.dots).toEqual(story1State.dots);
    });

    it("matches the visible-edge list exactly, aside from negligible glow fields", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      const story1State = computeRenderState(vertices, edgeSequence, edgeSequence.length);
      const glowState = computeRenderState(vertices, edgeSequence, edgeSequence.length, LARGER_ELAPSED, computeGlow, EDGE_PACING_MILLISECONDS);

      expect(stripGlowFields(glowState.visibleEdges)).toEqual(
        stripGlowFields(story1State.visibleEdges),
      );
      glowState.visibleEdges.forEach((edge) => {
        expect(edge.glow).toBeLessThan(EPSILON);
      });
    });
  });
});
