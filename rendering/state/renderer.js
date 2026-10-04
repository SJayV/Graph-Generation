/**
 * Top-level rendering entry point. `createRenderer` is a factory for the
 * current step index into the edge sequence and auto-advance playback.
 */
import { computeRenderState } from "./renderState.js";

// PUBLIC INTERFACE

export function createRenderer(renderData, edgePacingMilliseconds) {
  let stepIndex = 0;
  let intervalHandle = null;
  const startTime = Date.now();

  function getDisplayedState() {
    return computeRenderState(renderData, stepIndex, Date.now() - startTime, edgePacingMilliseconds);
  }

  function start() {
    if (intervalHandle !== null) {
      return;
    }
    intervalHandle = setInterval(() => {
      if (stepIndex >= renderData.edgeSequence.length) {
        stop();
        return;
      }
      stepIndex += 1;
    }, edgePacingMilliseconds);
  }

  function stop() {
    if (intervalHandle === null) {
      return;
    }
    clearInterval(intervalHandle);
    intervalHandle = null;
  }

  return { getDisplayedState, start, stop };
}
