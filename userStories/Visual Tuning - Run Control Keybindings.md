### User Story 2: Run Control Keybindings

As a viewer of the demo, I want to press Enter to restart the current algorithm on a fresh graph, and press Space to open an editable panel where I can retune generation parameters and apply them, so that I can experiment with different parameter values without editing code.

**Acceptance criteria**
1. Accepted when the Space key is pressed while the panel is hidden, a panel appears showing one editable input per parameter, each with a human-readable name above it, pre-filled with `parameters.js`'s current values.
2. Accepted when the panel is visible and an edit is staged without yet being applied, `parameters.js`'s exported values remain unchanged.
3. Accepted when the Space key is pressed again while the panel is visible and every staged value is within its valid bounds, the panel verifies and applies them: `parameters.js`'s values update to the staged values, the panel closes, and a fresh graph regenerates using them, on the same algorithm as before.
4. Accepted when the Space key is pressed again while the panel is visible and at least one staged value is outside its valid bounds, that value is rejected: `parameters.js`'s values remain unchanged, no regeneration occurs, and the panel stays open with an indication of which value(s) were rejected.
5. Accepted when the panel is open, no key other than Space has any effect until the panel is closed via a successful apply.
6. Accepted when the validation function is given a set of staged values, it reports exactly the values outside their bounds, and reports none when all are within bounds.
7. Accepted when the validation function is given a vertex count above `(gridSize + 1)^2`, a special-subset size above the vertex count, or a nearest-neighbor count above `vertexCount - 1`, it reports that value as invalid.
8. Accepted when new values are applied through `parameters.js`'s setter, every consumer uses them on its next use without reloading the page.
9. Accepted when the Enter key is pressed while the panel is closed, a freshly sampled vertex set, special subset, and candidate edge set are generated and passed to the currently selected algorithm, with no change to which algorithm is active.
10. Accepted when Enter is pressed while a previous graph's stepwise reveal animation was mid-playback, the previous render state is fully replaced.
11. Accepted when Tab is pressed while the panel is closed, its existing cycle-and-regenerate behavior is unaffected by the addition of Enter and Space handling.
12. Accepted when any key other than Tab, Enter, or Space is pressed while the panel is closed, the currently displayed algorithm and graph are unaffected.
