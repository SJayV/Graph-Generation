/** Samples a fresh vertex set and special subset for a single demo graph. */
import { createSeededRng } from "./logic/randomness/rng.js";
import { sampleVertices, selectSpecialSubset } from "./logic/randomness/vertices.js";

// CONSTANTS

const VERTEX_COUNT = 400;
const GRID_SIZE = 1000;
const SPECIAL_SUBSET_SIZE = 5;

// HELPER FUNCTIONS

function _createEntropySeed() {
  return Math.floor(Math.random() * 0xffffffff);
}

// PUBLIC INTERFACE

export function createGraph() {
  const rng = createSeededRng(_createEntropySeed());
  const allVertices = sampleVertices(VERTEX_COUNT, GRID_SIZE, rng);
  const specialSubset = selectSpecialSubset(allVertices, SPECIAL_SUBSET_SIZE, rng);
  return { allVertices, specialSubset };
}
