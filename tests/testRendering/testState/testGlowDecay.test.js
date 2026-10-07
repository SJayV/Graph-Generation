/**
 * visibleEdges[i]: { startIndex, endIndex, category, glow }
 * Edge i is revealed at i * EDGE_PACING_MILLISECONDS; glow follows that reveal time.
 * No fixed cooldown: glow decays asymptotically, approaching but never reaching 0.0
 */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../../rendering/state/renderState.js";
import { EDGE_PACING_MILLISECONDS } from "../../../parameters.js";
import { makeLinearEdgeSequence, makeRenderData, makeVertices } from "./fixtures.js";

const LARGE_ELAPSED = 5000;
const LARGER_ELAPSED = 20000;
const EPSILON = 0.01;

function revealTimeOf(edgeIndex) {
  return edgeIndex * EDGE_PACING_MILLISECONDS;
}

function stateAt(vertices, edgeSequence, stepIndex, currentTime) {
  return computeRenderState(
    makeRenderData(vertices, edgeSequence),
    stepIndex,
    currentTime,
    EDGE_PACING_MILLISECONDS,
  );
}

function stripGlowFields(visibleEdges) {
  return visibleEdges.map(({ startIndex, endIndex }) => ({ startIndex, endIndex }));
}

describe("Glow decay", () => {
  describe("glow is 1.0 at elapsed time 0, strictly within (0.0, 1.0) otherwise", () => {
    it("reports glow 1.0 when currentTime equals the edge's reveal time", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);

      const state = stateAt(vertices, edgeSequence, 2, revealTimeOf(0));

      expect(state.edges[0].glow).toBe(1.0);
    });

    it("follows each edge's own reveal time: later edges hit glow 1.0 later", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const state = stateAt(vertices, edgeSequence, 3, revealTimeOf(2));

      expect(state.edges[2].glow).toBe(1.0);
      expect(state.edges[0].glow).toBeLessThan(1.0);
    });

    it("keeps glow strictly between 0.0 and 1.0 for any positive elapsed time", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);

      [1, 1000, LARGE_ELAPSED, LARGER_ELAPSED].forEach((elapsed) => {
        const state = stateAt(vertices, edgeSequence, 2, revealTimeOf(0) + elapsed);
        expect(state.edges[0].glow).toBeGreaterThan(0.0);
        expect(state.edges[0].glow).toBeLessThan(1.0);
      });
    });
  });

  describe("glow gets arbitrarily close to 0.0 for large enough elapsed time", () => {
    it("drops below a small threshold at a very large elapsed time", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);

      const state = stateAt(vertices, edgeSequence, 2, revealTimeOf(0) + LARGER_ELAPSED);

      expect(state.edges[0].glow).toBeLessThan(EPSILON);
    });
  });

  describe("in the tail, glow trends toward 0.0 as elapsed time increases", () => {
    it("reports glow no greater for the larger of two elapsed times, both deep in the tail", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);

      const lessElapsed = stateAt(vertices, edgeSequence, 2, revealTimeOf(0) + LARGE_ELAPSED);
      const moreElapsed = stateAt(vertices, edgeSequence, 2, revealTimeOf(0) + LARGER_ELAPSED);

      expect(moreElapsed.edges[0].glow).toBeLessThanOrEqual(lessElapsed.edges[0].glow);
    });
  });

  describe("decay curve is a single fixed function across edges/graphs", () => {
    it("reports equal glow for two different edges at the same elapsed time", () => {
      const verticesA = makeVertices(3);
      const edgeSequenceA = makeLinearEdgeSequence(3);
      const verticesB = [[9, 9], [0, 0], [5, 3], [1, 1]];
      const edgeSequenceB = [[1, 0], [1, 3], [3, 2]];

      const stateA = stateAt(verticesA, edgeSequenceA, 1, revealTimeOf(0) + LARGE_ELAPSED);
      const stateB = stateAt(verticesB, edgeSequenceB, 1, revealTimeOf(0) + LARGE_ELAPSED);

      expect(stateA.edges[0].glow).toBe(stateB.edges[0].glow);
    });
  });

  describe("glow is purely visual, never affects the visible-edge set/order", () => {
    it("yields the same visible-edge set/order regardless of currentTime", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);

      const early = stateAt(vertices, edgeSequence, 3, 0);
      const late = stateAt(vertices, edgeSequence, 3, LARGER_ELAPSED);

      expect(stripGlowFields(late.edges)).toEqual(stripGlowFields(early.edges));
    });
  });

  describe("negligible-glow state matches an early state aside from glow fields", () => {
    it("matches vertices exactly at a very large currentTime", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);

      const early = stateAt(vertices, edgeSequence, edgeSequence.length, 0);
      const late = stateAt(vertices, edgeSequence, edgeSequence.length, LARGER_ELAPSED);

      expect(late.vertices).toEqual(early.vertices);
    });
  });
});
