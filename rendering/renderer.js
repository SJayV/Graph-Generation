/**
 * Top-level rendering entry point.
 *
 * `createRenderer` is a factory for:
 *   - the current step index into the edge sequence
 *   - auto-advance playback
 *
 * It delegates all render-state derivation to `renderState.js`'s
 * `computeRenderState`, which remains independently callable/queryable
 * (A9-A10).
 */
import * as renderStateModule from "./renderState.js";

export const EDGE_PACING_MILLISECONDS = 500;

export function createRenderer(vertices, edgeSequence) {
  let stepIndex = 0;
  let intervalHandle = null;

  function getDisplayedState() {
    return renderStateModule.computeRenderState(vertices, edgeSequence, stepIndex);
  }

  function setStepIndex(nextStepIndex) {
    stepIndex = nextStepIndex;
  }

  function start() {
    if (intervalHandle !== null) {
      return;
    }
    intervalHandle = setInterval(() => {
      if (stepIndex >= edgeSequence.length) {
        stop();
        return;
      }
      setStepIndex(stepIndex + 1);
    }, EDGE_PACING_MILLISECONDS);
  }

  function stop() {
    if (intervalHandle === null) {
      return;
    }
    clearInterval(intervalHandle);
    intervalHandle = null;
  }

  return { getDisplayedState, setStepIndex, start, stop };
}
