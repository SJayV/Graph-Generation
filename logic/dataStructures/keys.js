// PUBLIC INTERFACE

export function vertexKey(vertex) {
  return `${vertex[0]},${vertex[1]}`;
}

/** Canonical, order-independent key for an unordered vertex pair. */
export function edgeKey(u, v) {
  const [a, b] = [vertexKey(u), vertexKey(v)].sort();
  return `${a}|${b}`;
}
