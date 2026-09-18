/**
 * Loader from the logic layer's exported JSON shape into the
 * vertices/edgeSequence pair consumed by `computeRenderState`.
 *
 */

export function loadGraphData(parsedJson) {
  const { vertices, edgeSequence } = parsedJson;
  return { vertices, edgeSequence };
}
