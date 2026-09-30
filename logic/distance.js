/** Euclidean distance primitive shared by every shortest-path algorithm. */

// PUBLIC INTERFACE

export function distance(u, v) {
  return Math.hypot(u[0] - v[0], u[1] - v[1]);
}
