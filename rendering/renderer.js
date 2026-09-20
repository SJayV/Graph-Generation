/**
 * Top-level rendering entry point. `createRenderer` is a factory for the
 * current step index into the edge sequence and auto-advance playback.
 */
import { computeRenderState } from "./renderState.js";
import { computeGlow } from "./glow.js";

// CONSTANTS

export const EDGE_PACING_MILLISECONDS = 30;

// PUBLIC INTERFACE

export function createRenderer(vertices, edgeSequence) {
  let stepIndex = 0;
  let intervalHandle = null;
  let startTime = null;

  function getDisplayedState() {
    const currentTime = startTime === null ? undefined : Date.now() - startTime;
    return computeRenderState(vertices, edgeSequence, stepIndex, currentTime, computeGlow, EDGE_PACING_MILLISECONDS);
  }

  function setStepIndex(nextStepIndex) {
    stepIndex = nextStepIndex;
  }

  function start() {
    if (intervalHandle !== null) {
      return;
    }
    startTime = Date.now();
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
