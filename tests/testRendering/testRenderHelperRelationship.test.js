/**
 * Tests for User Story 1 ("Grid Rendering of Vertices and Edges"),
 * category "Render function / helper relationship" (PLAN.md Assumptions
 * A9-A10, Acceptance Criterion 5).
 *
 * Testability design (per AGENTS.md "composition over inheritance" and
 * PLAN.md's "Testability" architecture decision — the rendering layer
 * exposes a minimal programmatic entry point so behavior is assertable
 * without visual inspection):
 *
 *   rendering/renderState.js
 *     computeRenderState(vertices, edgeSequence, stepIndex) -> RenderState
 *       (the single source of truth for what is rendered at a given step;
 *       see testVertexRendering.test.js for the RenderState shape)
 *
 *   rendering/renderer.js
 *     createRenderer(vertices, edgeSequence, options?) -> Renderer
 *       Renderer := {
 *         getDisplayedState(): RenderState,  // returns whatever the last
 *                                            // call to computeRenderState
 *                                            // produced for the current step
 *         setStepIndex(stepIndex: number): void,
 *         start(): void,                     // begins auto-advance (see
 *                                            // testPlaybackPacing.test.js)
 *         stop(): void,
 *       }
 *
 * Since there is no real canvas/WebGL context in these tests, "displayed
 * output" is captured via `getDisplayedState()`, which must return the
 * *exact* object/value produced by `computeRenderState` for the renderer's
 * current step (A9). We assert this both by deep-equality and by spying on
 * the render-state module to confirm the top-level renderer actually calls
 * through to it rather than re-deriving state independently.
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
