### User Story 3: Noise-Driven Edge Shading

As a viewer of the demo, I want vertices rendered with a soft radial glow and edges rendered as soft, shimmering connections of light, so that the graph's appearance feels more alive without changing which information each color and glow convey.

**Acceptance criteria**
1. Accepted when a vertex is drawn, the fragment color at its sprite's center is a brightened version of its category's assigned base color, and the fragment color at its sprite's rim equals its unmodified category base color.
2. Accepted when fragments lie outside the circular sprite radius, they are discarded exactly as today.
3. Accepted when the vertex glow is drawn, it is independent from time.
4. Accepted when both "normal" and "special" category vertices are drawn, each radial glow brightens from its own distinct base color.
5. Accepted when `computeRenderState` is called with a defined `currentTime`, the returned render state carries one time-derived value usable to drive edge noise.
6. Accepted when `computeRenderState` is called twice with different `currentTime` values, that time-derived value differs between the two calls.
7. Accepted when edges of every category are drawn in the same frame, the same time-derived value and the same shader program are used for all three.
8. Accepted when an edge carries a `glow` value from the existing recency-glow-decay mechanism, the new noise-driven shading is present in addition to that glow blending.
9. Accepted when an edge glows from the recency mechanism, the glow brightens the entire edge uniformly, unmodulated by the noise.
10. Accepted when an edge is drawn, it is exactly as wide as a vertex where it meets each vertex, and broadens toward the middle.
11. Accepted when an edge is drawn, it flares, pinches and meanders sideways over time while staying attached to both vertices, with soft translucent sides and a faint halo.
12. Accepted when edges are drawn, they are translucent, and soft darker and lighter color stripes run lengthwise along each edge, following its shape and drifting slowly over time.
13. Accepted when edges overlap, they combine with normal alpha blending.
