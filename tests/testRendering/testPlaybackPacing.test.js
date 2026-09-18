/**
 * Tests for User Story 1 ("Grid Rendering of Vertices and Edges"),
 * category "Playback pacing" (PLAN.md Assumptions A11-A13, Acceptance
 * Criterion 6).
 *
 * Assumed interface: see testRenderHelperRelationship.test.js for
 * createRenderer/Renderer. Auto-advance is assumed to be driven by the
 * platform timer (setInterval/setTimeout) internally, at a fixed interval
 * exported as the ALL_CAPS constant `EDGE_PACING_MILLISECONDS` (per
 * AGENTS.md naming conventions: "constants as close as possible to their
 * shared use").
 *
 * Per PLAN.md: "The pacing between edges appearing on screen shall be
 * owned by the rendering layer, not derived from the Python algorithm's
 * real computation time" — and indeed no per-edge timing data is exported
 * from Python at all (A12), so there is nothing to derive pacing from
 * besides this rendering-layer constant.
 *
 * Timers are faked (vi.useFakeTimers()) so these tests are deterministic
 * and do not rely on real wall-clock waits.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

import { createRenderer, EDGE_PACING_MILLISECONDS } from "../../rendering/renderer.js";
import { makeLinearEdgeSequence, makeVertices } from "./fixtures.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Playback pacing", () => {
  describe("A11: fixed constant elapsed time between consecutive edges becoming visible", () => {
    it("reveals exactly one additional edge per EDGE_PACING_MILLISECONDS tick", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);
      const renderer = createRenderer(vertices, edgeSequence);

      renderer.start();

      expect(renderer.getDisplayedState().visibleEdges).toHaveLength(0);

      for (let expectedVisibleCount = 1; expectedVisibleCount <= edgeSequence.length; expectedVisibleCount += 1) {
        vi.advanceTimersByTime(EDGE_PACING_MILLISECONDS);
        expect(renderer.getDisplayedState().visibleEdges).toHaveLength(expectedVisibleCount);
      }
    });

    it("does not reveal the next edge before a full pacing interval has elapsed", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const renderer = createRenderer(vertices, edgeSequence);

      renderer.start();
      vi.advanceTimersByTime(EDGE_PACING_MILLISECONDS - 1);

      expect(renderer.getDisplayedState().visibleEdges).toHaveLength(0);
    });

    it("spaces every consecutive pair of edge reveals by the same constant duration", () => {
      const vertices = makeVertices(6);
      const edgeSequence = makeLinearEdgeSequence(6);
      const renderer = createRenderer(vertices, edgeSequence);
      const observedIntervalsBetweenReveals = [];
      let lastVisibleCount = 0;
      let millisecondsSinceLastReveal = 0;

      renderer.start();

      const millisecondsPerTick = 1;
      const totalDuration = EDGE_PACING_MILLISECONDS * edgeSequence.length;
      for (let elapsed = 0; elapsed < totalDuration; elapsed += millisecondsPerTick) {
        vi.advanceTimersByTime(millisecondsPerTick);
        millisecondsSinceLastReveal += millisecondsPerTick;

        const currentVisibleCount = renderer.getDisplayedState().visibleEdges.length;
        if (currentVisibleCount > lastVisibleCount) {
          observedIntervalsBetweenReveals.push(millisecondsSinceLastReveal);
          millisecondsSinceLastReveal = 0;
          lastVisibleCount = currentVisibleCount;
        }
      }

      expect(observedIntervalsBetweenReveals).toHaveLength(edgeSequence.length);
      observedIntervalsBetweenReveals.forEach((interval) => {
        expect(interval).toBe(EDGE_PACING_MILLISECONDS);
      });
    });
  });

  describe("A12: pacing does not depend on any per-edge timing from Python", () => {
    it("uses the same pacing constant regardless of which edges/vertices are supplied", () => {
      const verticesA = makeVertices(4);
      const edgeSequenceA = makeLinearEdgeSequence(4);
      const verticesB = [[9, 9], [0, 0], [5, 3], [1, 1]];
      const edgeSequenceB = [[1, 0], [1, 3], [3, 2]];

      const rendererA = createRenderer(verticesA, edgeSequenceA);
      const rendererB = createRenderer(verticesB, edgeSequenceB);

      rendererA.start();
      rendererB.start();

      vi.advanceTimersByTime(EDGE_PACING_MILLISECONDS);

      expect(rendererA.getDisplayedState().visibleEdges).toHaveLength(1);
      expect(rendererB.getDisplayedState().visibleEdges).toHaveLength(1);
    });
  });

  describe("A13: the pacing constant is fixed for a given run, independent of content/size", () => {
    it("takes exactly length * EDGE_PACING_MILLISECONDS to reveal a short sequence fully", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);
      const renderer = createRenderer(vertices, edgeSequence);

      renderer.start();
      vi.advanceTimersByTime(EDGE_PACING_MILLISECONDS * edgeSequence.length);

      expect(renderer.getDisplayedState().visibleEdges).toHaveLength(edgeSequence.length);
    });

    it("takes exactly length * EDGE_PACING_MILLISECONDS to reveal a long sequence fully, at the same rate", () => {
      const vertices = makeVertices(20);
      const edgeSequence = makeLinearEdgeSequence(20);
      const renderer = createRenderer(vertices, edgeSequence);

      renderer.start();
      vi.advanceTimersByTime(EDGE_PACING_MILLISECONDS * edgeSequence.length);

      expect(renderer.getDisplayedState().visibleEdges).toHaveLength(edgeSequence.length);
    });

    it("exposes EDGE_PACING_MILLISECONDS as a single fixed numeric constant", () => {
      expect(typeof EDGE_PACING_MILLISECONDS).toBe("number");
      expect(EDGE_PACING_MILLISECONDS).toBeGreaterThan(0);
    });
  });
});
