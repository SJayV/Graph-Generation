### User Story 8: Tab-Key Algorithm Switching

As a viewer of the demo, I want to press Tab to switch to the next algorithm and see a freshly generated graph grown by it, so that I can compare how the different connectivity strategies introduced by this feature grow a graph.

**Acceptance criteria**
1. Accepted when the demo starts, the active algorithm is the generation as first in a fixed ordered list.
2. Accepted when the pure cycling unit is advanced once from any given algorithm in the fixed ordered list, it returns the next algorithm in that list.
3. Accepted when the pure cycling unit is advanced once from the last algorithm in the fixed ordered list, it returns the first algorithm.
4. Accepted when the Tab key is pressed, a freshly sampled vertex set and special subset are generated and passed to the newly selected algorithm.
5. Accepted when the Tab key is pressed while a previous graph's stepwise reveal animation was mid-playback, the previous render state is fully replaced.
6. Accepted when any key other than Tab is pressed, the currently displayed algorithm and graph are unaffected.
7. Accepted when the current algorithm is displayed in the top left corner of the screen.
8. Accepted when the name display never overlaps with any component of the rendered graph.
