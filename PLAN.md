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

### User Story 2 (deferred): S-Fragmentation Observation across r

As a researcher, I want to run User Story 1's generator across a range of $r$ values and record whether $S$ collapses into a single component, so that I can characterize the fragmentation phenomenon empirically.

- Not written with numbered acceptance criteria yet — depends on User Story 1 being implemented, and needs a decision on trial count / statistical threshold before criteria can be made objectively verifiable. Deferred until User Story 1 is accepted.

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
