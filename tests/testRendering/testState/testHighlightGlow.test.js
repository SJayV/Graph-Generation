/**
 * Final-path highlight: the caller appends the edges returned by
 * algorithms/shortestPathSearch.js's identifyConnectingEdges as a *second
 * batch* onto the growth edgeSequence; specialStartIndex marks where it begins.
 */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../../rendering/state/renderState.js";
import { EDGE_PACING_MILLISECONDS } from "../../../parameters.js";
import { makeRenderData, makeVertices } from "./fixtures.js";

function stateAt(vertices, edgeSequence, specialStartIndex, currentTime) {
  return computeRenderState(
    makeRenderData(vertices, edgeSequence, { specialStartIndex }),
    edgeSequence.length,
    currentTime,
    EDGE_PACING_MILLISECONDS,
  );
}

describe("Final-path highlight glow", () => {
  describe("edges at or after specialStartIndex are reported as the special category", () => {
    it("marks only the appended second batch as special, the rest as normal", () => {
      const vertices = makeVertices(5);
      // growth batch: 0-1, 1-2 ; highlight batch (appended, duplicates 0-1): 0-1
      const edgeSequence = [[0, 1], [1, 2], [0, 1]];

      const renderState = stateAt(vertices, edgeSequence, 2, 0);

      expect(renderState.edges.map((edge) => edge.category)).toEqual([
        "normal",
        "normal",
        "special",
      ]);
    });

    it("reports every visible edge as normal when no special edges exist", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2]];

      const renderState = stateAt(vertices, edgeSequence, Infinity, 0);

      expect(renderState.edges.map((edge) => edge.category)).toEqual([
        "normal",
        "normal",
      ]);
    });
  });

  describe("special edges reuse the exact same glow-at-reveal-then-decay behavior as growth edges", () => {
    it("reports glow 1.0 for a special edge exactly at its own reveal time", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2]];

      const renderState = stateAt(vertices, edgeSequence, 1, 1 * EDGE_PACING_MILLISECONDS);

      expect(renderState.edges[1].category).toBe("special");
      expect(renderState.edges[1].glow).toBe(1.0);
    });
  });

  describe("a duplicated edge pair appears twice in visibleEdges, once per batch, never deduplicated", () => {
    it("keeps both the original and the appended special occurrence of the same pair", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2], [0, 1]];

      const renderState = stateAt(vertices, edgeSequence, 2, 0);

      expect(renderState.edges).toHaveLength(3);
      const duplicatePairOccurrences = renderState.edges.filter(
        (edge) => edge.startIndex === 0 && edge.endIndex === 1,
      );
      expect(duplicatePairOccurrences).toHaveLength(2);
    });

    it("gives the two occurrences independent glow values", () => {
      const vertices = makeVertices(3);
      const edgeSequence = [[0, 1], [1, 2], [0, 1]];

      // At the special occurrence's reveal time it is at full glow, the earlier twin has decayed.
      const renderState = stateAt(vertices, edgeSequence, 2, 2 * EDGE_PACING_MILLISECONDS);

      const [originalOccurrence, , specialOccurrence] = renderState.edges;
      expect(specialOccurrence.glow).toBe(1.0);
      expect(originalOccurrence.glow).toBeLessThan(specialOccurrence.glow);
    });
  });
});
