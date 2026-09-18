### User Story 2: S-Fragmentation Observation across r

As a researcher, I want to run User Story 1's generator across a range of $r$ values and record whether $S$ collapses into a single component, so that I can characterize the fragmentation phenomenon empirically.

**Acceptance criteria**
1. Accepted when, given $r$, trial count $N$, vertex count $n$, grid size $L$, and special-subset size $k$, the study runs $N$ independent trials — each with its own fresh RNG-seeded vertex sampling, special-subset selection, and `growEdges` call at that $r$ — and returns the proportion of trials in which every member of the special subset shares the same DSU root.
2. Accepted when $N$, $n$, $L$, $k$, and the list of $r$ values to sweep are all caller-supplied parameters, with no hardcoded defaults.
3. Accepted when, given a list of $(r,\text{proportion})$ data points, the sigmoid-fitting function returns fitted parameters $(k_{\text{fit}}, r_0)$ for $p(r)=1/(1+e^{-k_{\text{fit}}(r-r_0)})$, computed via a hand-rolled optimization (no new third-party dependency).
4. Accepted when, given synthetic $(r,\text{proportion})$ data generated from a known ground-truth $r_0$ (with bounded noise) over a chosen $r$-range, the fitting function recovers that $r_0$ within $10\%$ of the span of that range: $|\hat r_0-r_0|\le 0.1\cdot(\max(r)-\min(r))$.
5. Accepted when the full sweep-and-fit study, given a list of $r$ values plus $n,L,k,N$, returns both the fitted $(k_{\text{fit}}, r_0)$ and the raw list of per-$r$ $(r,\text{proportion})$ data points it was fit from.