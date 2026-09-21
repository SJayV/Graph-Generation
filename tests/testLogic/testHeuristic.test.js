/**
 * logic/heuristic.js: defaultHeuristic(vertex, notYetConnectedSpecials)
 * Admissible A* heuristic adapted to "connect all specials", not one fixed target.
 */
import { describe, expect, it } from "vitest";

import { defaultHeuristic } from "../../logic/heuristic.js";
import { distance } from "../../logic/distance.js";

describe("defaultHeuristic", () => {
  describe("TestNearestSpecialDistance", () => {
    it("returns the distance to the single not-yet-connected special", () => {
      const vertex = [0, 0];
      const specials = [[3, 4]];
      expect(defaultHeuristic(vertex, specials)).toBe(5);
    });

    it("returns the distance to the nearest of several not-yet-connected specials", () => {
      const vertex = [0, 0];
      const specials = [[10, 0], [1, 0], [0, 5]];
      expect(defaultHeuristic(vertex, specials)).toBe(distance(vertex, [1, 0]));
    });

    it("is unaffected by the order of the specials array", () => {
      const vertex = [0, 0];
      const forward = [[10, 0], [1, 0], [0, 5]];
      const backward = [...forward].reverse();
      expect(defaultHeuristic(vertex, forward)).toBe(defaultHeuristic(vertex, backward));
    });
  });

  describe("TestQueriedVertexIsAlreadySpecial", () => {
    it("returns 0 when the queried vertex is itself in the not-yet-connected set", () => {
      const vertex = [4, 4];
      const specials = [[4, 4], [9, 9]];
      expect(defaultHeuristic(vertex, specials)).toBe(0);
    });
  });

  describe("TestAdmissibility", () => {
    it("never exceeds the true distance to the nearest special (straight-line lower bound)", () => {
      const vertex = [2, 2];
      const specials = [[9, 1], [-3, 5]];
      const trueNearest = Math.min(...specials.map((s) => distance(vertex, s)));
      expect(defaultHeuristic(vertex, specials)).toBeLessThanOrEqual(trueNearest + 1e-9);
    });
  });
});
