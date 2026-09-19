/** Seedable PRNG utility and reusable without-replacement sampling. */

// PUBLIC INTERFACE

/** Creates a deterministic pseudo-random number generator. */
export function createSeededRng(seed) {
  let state = seed >>> 0;

  function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return { random };
}

export function sampleWithoutReplacement(rngSource, population, count) {
  const pool = [...population];
  const result = [];

  for (let position = 0; position < count; position += 1) {
    const remaining = pool.length - position;
    const pickIndex = position + Math.floor(rngSource.random() * remaining);
    result.push(pool[pickIndex]);
    pool[pickIndex] = pool[position];
  }

  return result;
}
