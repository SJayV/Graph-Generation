### User Story 1: Centralized Parametrization

As a maintainer of the demo, I want all tunable generation constants centralized in one parameters module, so that I can change a single file to retune graph generation across the whole app.

**Acceptance criteria**
1. Accepted when `parameters.js` exports named values for vertex count, grid size, special-subset size, sparsity, nearest-neighbor count, field dampening factor, field strengthening factor, edge reveal pacing, and screen margin fraction.
2. Accepted when `graph.js` imports vertex count, grid size, and special-subset size from `parameters.js`, and no longer declares its own constants for those three values.
3. Accepted when `dispatcher.js` imports sparsity from `parameters.js`, and no longer declares its own constant for sparsity.
4. Accepted when `logic/randomness/edges.js` imports the nearest-neighbor count from `parameters.js`, and no longer declares its own constant for that value.
5. Accepted when `parameters.js`'s unified sigma function is given a vertex count and grid size, it produces `gridSize / Math.sqrt(vertexCount)`; neither `dispatcher.js` nor `logic/computation/field.js` has its own sigma function anymore, and both `dispatcher.js` and `empirical/trialRunner.js` call `parameters.js`'s function instead.
6. Accepted when one exported value in `parameters.js` is changed and the demo is reloaded, the corresponding generated graph property changes with no edits to any file other than `parameters.js`.
7. Accepted when `parameters.js`'s own module source is inspected, it imports nothing from `graph.js`, `dispatcher.js`, or `logic/randomness/edges.js`.
8. Accepted when `logic/computation/field.js`'s `fieldValue` and `key` are called with the same inputs (including sigma) as today, they produce the exact same numeric results as today, now sourcing their dampening/strengthening factor from `parameters.js`.
9. Accepted when `rendering/state/renderer.js` is used to create and run a renderer, its edge-reveal pacing still matches today's value, now sourced directly from `parameters.js` with no re-export from `renderer.js`'s own export surface.
10. Accepted when `rendering/gl/glPrimitives.js`'s coordinate-mapping functions are called with the same inputs as today, they produce the exact same numeric results as today, now sourcing the screen margin fraction from `parameters.js`.
