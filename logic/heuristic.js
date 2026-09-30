/** Default A* heuristic adapted to the "connect all specials" framing. */
import { distance } from "./distance.js";

// PUBLIC INTERFACE

/** Straight-line distance from vertex to the nearest not-yet-connected special vertex. */
export function defaultHeuristic(vertex, notYetConnectedSpecials) {
  if (notYetConnectedSpecials.length === 0) {
    return 0;
  }
  return Math.min(...notYetConnectedSpecials.map((special) => distance(vertex, special)));
}
