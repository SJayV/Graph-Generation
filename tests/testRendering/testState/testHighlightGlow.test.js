/**
 * Final-path highlight: the caller appends the edges returned by
 * algorithms/shortestPathSearch.js's identifyConnectingEdges as a *second
 * batch* onto the growth edgeSequence.
 */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../../rendering/state/renderState.js";
import { computeGlow } from "../../../rendering/state/glow.js";
import { EDGE_PACING_MILLISECONDS } from "../../../parameters.js";
import { makeVertices } from "./fixtures.js";

describe("Final-path highlight glow", () => {
  describe("edges at or after highlightStartIndex are reported as the highlight category", () => {
    it("marks only the appended second batch as highlight, the rest as growth", () => {
      const vertices = makeVertices(5);
      // growth batch: 0-1, 1-2 ; highlight batch (appended, duplicates 0-1): 0-1
      const edgeSequence = [[0, 1], [1, 2], [0, 1]];
      const highlightStartIndex = 2;

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
        0,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        undefined,
        highlightStartIndex,
      );

      expect(renderState.edges.map((edge) => edge.category)).toEqual([
        "normal",
        "normal",
        "special",
      ]);
    });

    it("reports every visible edge as growth when no highlightStartIndex is given", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2]];

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
        0,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
      );

      expect(renderState.edges.map((edge) => edge.category)).toEqual([
        "normal",
        "normal",
      ]);
    });
  });

  describe("highlight edges reuse the exact same glow-at-reveal-then-decay behavior as growth edges", () => {
    it("reports glow 1.0 for a highlight edge exactly at its own becameVisibleAt", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2]];
      const highlightStartIndex = 1;

      const probe = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
        0,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        undefined,
        highlightStartIndex,
      );
      const highlightBecameVisibleAt = probe.edges[1].becameVisibleAt;

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
        highlightBecameVisibleAt,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        undefined,
        highlightStartIndex,
      );

      expect(renderState.edges[1].category).toBe("special");
      expect(renderState.edges[1].glow).toBe(1.0);
    });

    it("decays a highlight edge's glow toward 0.0 for large elapsed time, same as a growth edge would", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2]];
      const highlightStartIndex = 1;
      const LARGE_ELAPSED = 20000;
      const EPSILON = 0.01;

      const probe = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
        0,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        undefined,
        highlightStartIndex,
      );
      const highlightBecameVisibleAt = probe.edges[1].becameVisibleAt;

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
        highlightBecameVisibleAt + LARGE_ELAPSED,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        undefined,
        highlightStartIndex,
      );

      expect(renderState.edges[1].glow).toBeLessThan(EPSILON);
    });
  });

  describe("a duplicated edge pair appears twice in visibleEdges, once per batch, never deduplicated", () => {
    it("keeps both the original and the appended highlight occurrence of the same pair", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2], [0, 1]];
      const highlightStartIndex = 2;

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
        0,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        undefined,
        highlightStartIndex,
      );

      expect(renderState.edges).toHaveLength(3);
      const duplicatePairOccurrences = renderState.edges.filter(
        (edge) => edge.startIndex === 0 && edge.endIndex === 1,
      );
      expect(duplicatePairOccurrences).toHaveLength(2);
    });

    it("places the highlight occurrence after the original occurrence in draw order", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2], [0, 1]];
      const highlightStartIndex = 2;

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
        0,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        undefined,
        highlightStartIndex,
      );

      const originalIndex = renderState.edges.findIndex(
        (edge) => edge.startIndex === 0 && edge.endIndex === 1 && edge.category === "normal",
      );
      const highlightIndex = renderState.edges.findIndex(
        (edge) => edge.startIndex === 0 && edge.endIndex === 1 && edge.category === "special",
      );

      expect(originalIndex).toBeGreaterThanOrEqual(0);
      expect(highlightIndex).toBeGreaterThan(originalIndex);
    });

    it("gives the two occurrences independent becameVisibleAt/glow values", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2], [0, 1]];
      const highlightStartIndex = 2;

      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
        0,
        computeGlow,
        EDGE_PACING_MILLISECONDS,
        undefined,
        highlightStartIndex,
      );

      const [originalOccurrence, , highlightOccurrence] = renderState.edges;
      expect(highlightOccurrence.becameVisibleAt).not.toBe(originalOccurrence.becameVisibleAt);
    });
  });
});
