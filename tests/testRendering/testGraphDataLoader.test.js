/**
 * Tests for User Story 1 ("Grid Rendering of Vertices and Edges"),
 * category "JSON data loading" (PLAN.md Assumption A14, Acceptance
 * Criterion 7).
 *
 * Assumed interface under test:
 *
 *   rendering/graphDataLoader.js
 *     loadGraphData(parsedJson) -> { vertices, edgeSequence }
 *
 * `parsedJson` is the already-`JSON.parse`d content of the logic layer's
 * exported JSON file (per AGENTS.md's Architecture Map / PLAN.md's
 * Architecture Decisions):
 *
 *   parsedJson := {
 *     vertices: Array<[number, number]>,
 *     edgeSequence: Array<[number, number]>,
 *   }
 *
 * `loadGraphData` performs no parsing of raw JSON text itself (that is the
 * caller's concern) and applies no reordering, scaling, or other
 * transformation of the values (A14) — it returns `vertices` and
 * `edgeSequence` in the exact shape required by
 * `computeRenderState`/`createRenderer`, i.e. values that are deep-equal to
 * (and directly usable in place of) the input's `vertices`/`edgeSequence`
 * fields.
 */
import { describe, expect, it } from "vitest";

import { computeRenderState } from "../../rendering/renderState.js";
import { loadGraphData } from "../../rendering/graphDataLoader.js";
import { makeLinearEdgeSequence, makeVertices } from "./fixtures.js";

describe("JSON data loading", () => {
  describe("A14: loader returns vertices/edgeSequence unchanged", () => {
    it("returns a vertices array deep-equal to the parsed JSON's vertices", () => {
      const parsedJson = {
        vertices: [[0, 0], [3, 7], [10, 2]],
        edgeSequence: [[0, 1], [1, 2]],
      };

      const { vertices } = loadGraphData(parsedJson);

      expect(vertices).toEqual(parsedJson.vertices);
    });

    it("returns an edgeSequence array deep-equal to the parsed JSON's edgeSequence", () => {
      const parsedJson = {
        vertices: [[0, 0], [3, 7], [10, 2]],
        edgeSequence: [[0, 1], [1, 2]],
      };

      const { edgeSequence } = loadGraphData(parsedJson);

      expect(edgeSequence).toEqual(parsedJson.edgeSequence);
    });

    it("preserves vertex order without reordering", () => {
      const parsedJson = {
        vertices: [[5, 5], [1, 1], [9, 0]],
        edgeSequence: [],
      };

      const { vertices } = loadGraphData(parsedJson);

      expect(vertices).toEqual([[5, 5], [1, 1], [9, 0]]);
    });

    it("preserves edge sequence order without reordering", () => {
      const parsedJson = {
        vertices: makeVertices(4),
        edgeSequence: [[2, 3], [0, 1], [1, 2]],
      };

      const { edgeSequence } = loadGraphData(parsedJson);

      expect(edgeSequence).toEqual([[2, 3], [0, 1], [1, 2]]);
    });

    it("does not scale or otherwise transform vertex coordinates", () => {
      const parsedJson = {
        vertices: [[-5, -5], [1000, 1000], [0, 0]],
        edgeSequence: [],
      };

      const { vertices } = loadGraphData(parsedJson);

      expect(vertices).toEqual([[-5, -5], [1000, 1000], [0, 0]]);
    });

    it("returns an empty vertices array unchanged when given no vertices", () => {
      const parsedJson = { vertices: [], edgeSequence: [] };

      const { vertices } = loadGraphData(parsedJson);

      expect(vertices).toEqual([]);
    });

    it("returns an empty edgeSequence array unchanged when given no edges", () => {
      const parsedJson = { vertices: makeVertices(3), edgeSequence: [] };

      const { edgeSequence } = loadGraphData(parsedJson);

      expect(edgeSequence).toEqual([]);
    });
  });

  describe("AC7: loader output is directly usable by computeRenderState", () => {
    it("produces a render state identical to using the raw parsed values directly", () => {
      const parsedJson = {
        vertices: makeVertices(5),
        edgeSequence: makeLinearEdgeSequence(5),
      };

      const { vertices, edgeSequence } = loadGraphData(parsedJson);

      const stateFromLoader = computeRenderState(vertices, edgeSequence, 2);
      const stateFromRawJson = computeRenderState(
        parsedJson.vertices,
        parsedJson.edgeSequence,
        2,
      );

      expect(stateFromLoader).toEqual(stateFromRawJson);
    });

    it("yields dots positioned exactly at the loaded vertex coordinates", () => {
      const parsedJson = {
        vertices: [[0, 0], [4, 4]],
        edgeSequence: [[0, 1]],
      };

      const { vertices, edgeSequence } = loadGraphData(parsedJson);
      const renderState = computeRenderState(vertices, edgeSequence, 1);

      expect(renderState.dots[0].position).toEqual([0, 0]);
      expect(renderState.dots[1].position).toEqual([4, 4]);
    });

    it("yields a visible-edge list matching the loaded edge sequence at full step", () => {
      const parsedJson = {
        vertices: makeVertices(4),
        edgeSequence: makeLinearEdgeSequence(4),
      };

      const { vertices, edgeSequence } = loadGraphData(parsedJson);
      const renderState = computeRenderState(
        vertices,
        edgeSequence,
        edgeSequence.length,
      );

      expect(renderState.visibleEdges).toEqual([
        { startIndex: 0, endIndex: 1 },
        { startIndex: 1, endIndex: 2 },
        { startIndex: 2, endIndex: 3 },
      ]);
    });
  });
});
