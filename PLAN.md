# Feature: Graph Generation

## Final formalization (all resolved)

**Graph**
- $V\subseteq\{0,\dots,L\}^2\cap\mathbb N^2$, screen-filling $L$, fine grid granularity, all $\mu_v$ **unique** (sample without replacement)
- $|V|=n$, $E\subseteq\binom V2$ (unordered, no self-loops)
- $w(u,v)=\lVert u-v\rVert_2$
- $r\in\mathbb R_+,\ m=\lfloor rn\rfloor$
- $S\subseteq V$

**Component / DSU**
- $\rho(v)=\text{find}(v)$, $C(\rho)=S\cap\text{component}(\rho)$
- `union`: $C(\rho_{\text{new}})=C(\rho_1)\cup C(\rho_2)$, $O(1)$

**Field** (priority contribution, not a probability — unbounded above)
$$
\text{str}(v)=\sqrt{|C(\rho(v))|}
$$
$$
F_{\rho(v)}(x)=\text{str}(v)\cdot N(x\mid \mu_v,\sigma^2),\qquad \sigma \sim O(L)\text{-scaled, }\mu_v\text{ fixed}
$$
- single Gaussian bump centered on $v$ itself (not a sum over $C(\rho(v))$), scaled by $v$'s current component strength

**Priority score** (symmetric, unclamped)
$$
\text{key}(\{u,v\}) = p_0+\big(F_{\rho(v)}(u)+F_{\rho(u)}(v)\big)
$$
- sum, not max — collapses to $p_0+N(u,v)\cdot(\text{str}(u)+\text{str}(v))$ since $N(u\mid\mu_v,\sigma^2)=N(v\mid\mu_u,\sigma^2)$
- no $\min(1,\cdot)$ — pure ranking value

**Algorithm**
- candidates: all $\{u,v\}\in\binom V2$, $u\neq v$
- max-heap keyed by $\text{key}$
- pop → recompute key from current DSU state → if unchanged: accept, remove from future candidates, `union` if needed → else reinsert refreshed
- stop at $|E|=m$

**Demonstrated effect of low $r$**
- heap always places exactly $m$ edges (reaches $m\le\binom n2$ regardless)
- what fails at low $r$: $S$-containing components stay **fragmented** — not all of $S$ merges into one component — this is the phenomenon under study, not an edge-count shortfall

## Assessment: no open gaps

- symmetry ✓ (max), unboundedness ✓ (priority not probability), domain/scale ✓ (large grid, unique positions, $\sigma\propto L$), semantics of "$r$ too low" ✓ (fragmentation, not under-filling), self-loops/dupes ✓ (excluded by construction, accepted pairs removed from candidate pool)
- model is now fully specified and internally consistent — ready to prototype/simulate

## User Stories

### User Story 2: S-Fragmentation Observation across r

As a researcher, I want to run User Story 1's generator across a range of $r$ values and record whether $S$ collapses into a single component, so that I can characterize the fragmentation phenomenon empirically.

**Acceptance criteria**
1. Accepted when, given $r$, trial count $N$, vertex count $n$, grid size $L$, and special-subset size $k$, the study runs $N$ independent trials — each with its own fresh RNG-seeded vertex sampling, special-subset selection, and `growEdges` call at that $r$ — and returns the proportion of trials in which every member of the special subset shares the same DSU root.
2. Accepted when $N$, $n$, $L$, $k$, and the list of $r$ values to sweep are all caller-supplied parameters, with no hardcoded defaults.
3. Accepted when, given a list of $(r,\text{proportion})$ data points, the sigmoid-fitting function returns fitted parameters $(k_{\text{fit}}, r_0)$ for $p(r)=1/(1+e^{-k_{\text{fit}}(r-r_0)})$, computed via a hand-rolled optimization (no new third-party dependency).
4. Accepted when, given synthetic $(r,\text{proportion})$ data generated from a known ground-truth $r_0$ (with bounded noise) over a chosen $r$-range, the fitting function recovers that $r_0$ within $10\%$ of the span of that range: $|\hat r_0-r_0|\le 0.1\cdot(\max(r)-\min(r))$.
5. Accepted when the full sweep-and-fit study, given a list of $r$ values plus $n,L,k,N$, returns both the fitted $(k_{\text{fit}}, r_0)$ and the raw list of per-$r$ $(r,\text{proportion})$ data points it was fit from.

**Resolved**
- trial count $N=30$ recommended default, but caller-configurable, not hardcoded
- $r$-sweep is a caller-supplied list, not a hardcoded range
- $n$, $L$, $k$ are all caller-supplied, no defaults
- sigmoid fit is hand-rolled via 2D Newton-Raphson on the squared-error loss $L(k,r_0)=\sum_i\big(p(r_i;k,r_0)-\text{proportion}_i\big)^2$, iterating $(k,r_0)$ until $\nabla L\approx 0$ (using $L$'s Hessian for the update step) — no scipy/numpy dependency added
- AC4's tolerance is relative to the tested $r$-range span (not an absolute constant), so it stays meaningful across different scales
- $k=0$ or $k=1$ trivially make "$S$ collapsed" vacuously/immediately true (proportion $=1.0$ every trial) — allowed, no special-casing/validation added
- $\sigma$ is not a separate caller-supplied parameter here — the trial-runner derives it internally as $\sigma=L/10$ (per A15) before calling `growEdges`, same as Story 1's fixed convention
- Newton-Raphson fitting: initial guess $r_0=\text{midpoint of the tested }r\text{-range}$, $k_{\text{fit}}=1.0$; iterate until $\lVert\nabla L\rVert<\varepsilon$ or a max-iteration cap is hit (return whatever $(k_{\text{fit}},r_0)$ it has at that point, no exception raised); $k_{\text{fit}}$ is constrained $>0$ during iteration
- the $N$ trials share one caller-supplied `random.Random` instance, advanced sequentially across all $N$ trials (one seed reproduces the whole batch)

## Assumptions

**Vertices**
- A1: $n\in\mathbb N,\ n\ge 1$
- A2: $L\in\mathbb N,\ L\ge 1$
- A3: $n\le(L+1)^2$ — cannot sample more unique grid points than the grid contains
- A4: for all $u\neq v \in V$: $\mu_u\neq\mu_v$ (pairwise-distinct coordinates)
- A5: for all $v\in V$: $\mu_v\in\{0,\dots,L\}^2$

**Special subset $S$**
- A6: $S\subseteq V$
- A7: requested size $k$ satisfies $0\le k\le n$, and $|S|=k$
- A8: no element of $V$ occurs more than once in $S$

**DSU / components**
- A9: at any point in time, the components induced by $\rho$ form a partition of $V$ (every vertex belongs to exactly one component)
- A10: before any edge is accepted, every vertex is its own singleton component
- A11: for every root $\rho$: $|C(\rho)| = |\{s\in S : \rho(s)=\rho\}|$ — holds as an invariant at all times, not only after termination
- A12: on `union`$(\rho_1,\rho_2)\to\rho_{\text{new}}$: $|C(\rho_{\text{new}})| = |C(\rho_1)|+|C(\rho_2)|$
- A13: `union` on two vertices already sharing a root changes no component state (idempotent)
- A14: the number of distinct components is monotonically non-increasing over the algorithm's run — components merge, never split

**Field**
- A15: $\sigma=L/10$, fixed for the duration of a run (not recomputed, not caller-supplied)
- A16: $F_{\rho(v)}(x)$ is a pure function of $x$ and the current component state of $\rho(v)$ — same inputs always yield the same value
- A17: $F_{\rho(v)}(x)\ge 0$ for all $x$ (nonnegative strength times nonnegative Gaussian density sum)
- A18: $F_{\rho(v)}(x)=0$ for all $x$ iff $|C(\rho(v))|=0$ (component contains no $S$-members)
- A19: $\text{key}(\{u,v\})=\text{key}(\{v,u\})$ (symmetric under argument swap)
- A20: $\text{key}(\{u,v\})$ depends only on the current component state of $u$ and $v$, not on the history of how that state was reached

**Algorithm**
- A21: the candidate pool starts as all $\{u,v\}\in\binom V2,\ u\neq v$, size $\binom n2$
- A22: once a pair is accepted into $E$, it is never removed from $E$ and never re-enters the candidate pool
- A23: a popped candidate is accepted iff its key, recomputed against the current DSU state, equals the key under which it was popped; otherwise it is reinserted with the refreshed key and not accepted this round
- A24: the algorithm halts when $|E|=\min(m,\binom n2)$, where $m=\lfloor rn\rfloor$
- A25: $r\in\mathbb R_+$; $r$ may be large enough that $m>\binom n2$, in which case termination is still guaranteed (bounded candidate pool)
- A26: $E$ contains no self-loops and no duplicate unordered pairs
- A27: the algorithm terminates in finitely many steps for any finite $n$ (candidate pool is finite and strictly shrinks each round a pair is accepted)

**Trial-runner (User Story 2)**
- A28: given $r$, $N\in\mathbb N,\ N\ge 1$, $n$, $L$, $k$, and a shared RNG, the trial-runner produces exactly $N$ trial outcomes
- A29: each trial draws its own fresh $n$-vertex set and size-$k$ special subset from the shared RNG, sequentially advancing it — no two trials reuse the same sample
- A30: a trial's outcome is true iff all members of that trial's special subset resolve to the same DSU root after growth; true vacuously when $k\in\{0,1\}$
- A31: the trial-runner's result is the proportion (a value in $[0,1]$) of the $N$ outcomes that are true
- A32: the trial-runner is a pure function of $(r,n,L,k,N,\text{RNG state})$ — the same inputs, including the exact RNG state, always yield the same proportion
- A33: $\sigma$ is not an independent input to the trial-runner; it is fixed as $\sigma=L/10$, consistent with A15
- A41: if `growEdges`'s resulting DSU has a single component spanning all of $V$ (`componentCount()`$=1$), the trial's outcome is necessarily true — $S\subseteq V$ is then trivially within that one component too (sufficient, not necessary, for a true outcome)
- A42: if $r=0$ (equivalently $E=\emptyset$) and $k\ge 2$, the trial's outcome is necessarily false — every special member remains its own singleton component

**Sigmoid fit (User Story 2)**
- A34: given any non-empty list of $(r,\text{proportion})$ pairs, the fit always terminates and returns some $(k_{\text{fit}}, r_0)$ pair
- A35: the returned $k_{\text{fit}}>0$, regardless of what the data would otherwise imply
- A36: given synthetic data generated from a genuine sigmoid with a known $r_0$ and $k>0$ plus bounded noise, the fitted $r_0$ recovers the true $r_0$ within a tolerance proportional to the span of the tested $r$-range (not a fixed absolute tolerance)
- A37: the fit is a pure function of its input data list — the same list of $(r,\text{proportion})$ pairs always yields the same $(k_{\text{fit}},r_0)$
- A43: the returned $(k_{\text{fit}}, r_0)$ is intended to (locally) minimize the squared loss $L$ over the given data — a stationary point of $L$, not an arbitrary pair; where $L$ has multiple local minima, only local (not necessarily global) optimality is guaranteed
- A44: when every input proportion equals the same constant (e.g. all $1$, which is exactly what A30 implies whenever the trial-runner's special-subset size is $0$ or $1$), $L$ has no finite global minimizer — it strictly decreases as $k_{\text{fit}}\to\infty$ — so the fit must still terminate per A34 rather than diverge, returning some large-but-finite $k_{\text{fit}}$ at the iteration cap

**Sweep-and-fit orchestrator (User Story 2)**
- A38: given a list of $r$ values plus $n,L,k,N$ and an RNG, the orchestrator calls the trial-runner once per $r$ value, using the same $(n,L,k,N)$ each time, continuing to advance the same shared RNG across the entire sweep
- A39: the orchestrator's result includes both the raw list of $(r,\text{proportion})$ pairs (one per swept $r$, in the given order) and the $(k_{\text{fit}},r_0)$ obtained by fitting that same list
- A40: the number of returned $(r,\text{proportion})$ pairs equals the number of $r$ values given — none skipped, none duplicated
- A45: because the shared RNG advances sequentially across the whole sweep (A38), a given $r$'s outcome depends on which other $r$ values were processed before it in the list — reordering the input list, or repeating the same $r$ within one sweep, can yield a different proportion for that $r$ each time; determinism (A32) holds for the sweep as a whole given a fixed list order and starting RNG state, not for an individual $r$ in isolation
