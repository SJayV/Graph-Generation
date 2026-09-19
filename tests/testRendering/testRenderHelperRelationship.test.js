/**
 * rendering/renderer.js: createRenderer - getDisplayedState delegates to
 * rendering/renderState.js's computeRenderState
 */
import { describe, expect, it, vi } from "vitest";

import * as renderStateModule from "../../rendering/renderState.js";
import { createRenderer } from "../../rendering/renderer.js";
import { makeLinearEdgeSequence, makeVertices } from "./fixtures.js";

describe("Render function / helper relationship", () => {
  describe("A10: the render-state helper is independently callable and queryable", () => {
    it("can be called directly, with no renderer/top-level function involved", () => {
      const vertices = makeVertices(3);
      const edgeSequence = makeLinearEdgeSequence(3);

      const renderState = renderStateModule.computeRenderState(vertices, edgeSequence, 1);

      expect(renderState.dots).toHaveLength(3);
      expect(renderState.visibleEdges).toHaveLength(1);
    });
  });

  describe("A9: the renderer's displayed output is fully determined by the helper", () => {
    it("returns a displayed state deep-equal to a direct computeRenderState call at the same step", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);
      const stepIndex = 2;

      const renderer = createRenderer(vertices, edgeSequence);
      renderer.setStepIndex(stepIndex);

      const expectedState = renderStateModule.computeRenderState(vertices, edgeSequence, stepIndex);

      expect(renderer.getDisplayedState()).toEqual(expectedState);
    });

    it("delegates to computeRenderState rather than deriving state independently", () => {
      const vertices = makeVertices(4);
      const edgeSequence = makeLinearEdgeSequence(4);
      const computeRenderStateSpy = vi.spyOn(renderStateModule, "computeRenderState");

      const renderer = createRenderer(vertices, edgeSequence);
      renderer.setStepIndex(2);
      renderer.getDisplayedState();

      expect(computeRenderStateSpy).toHaveBeenCalled();

      computeRenderStateSpy.mockRestore();
    });

    it("updates the displayed state to match the helper's output whenever the step changes", () => {
      const vertices = makeVertices(5);
      const edgeSequence = makeLinearEdgeSequence(5);
      const renderer = createRenderer(vertices, edgeSequence);

      [0, 1, 3, 5].forEach((stepIndex) => {
        renderer.setStepIndex(stepIndex);
        const expectedState = renderStateModule.computeRenderState(vertices, edgeSequence, stepIndex);
        expect(renderer.getDisplayedState()).toEqual(expectedState);
      });
    });
  });
});
