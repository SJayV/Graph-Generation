### User Story 1: Priority-Weighted Edge Growth

As a researcher studying network connectivity, I want to generate a graph on $n$ uniquely-positioned vertices by greedily adding edges in order of a Gaussian-field-based priority score until $m=\lfloor rn\rfloor$ edges exist, so that I can inspect the resulting edge set and component structure for a given $r$.

**Acceptance criteria**
1. Accepted when vertex generation produces exactly $n$ vertices with pairwise-distinct integer coordinates in $\{0,\dots,L\}^2$.
2. Accepted when the special subset $S$ is a subset of $V$ of the requested size, with no duplicate members.
3. Accepted when the generated graph has $|E|=\min(m,\binom n2)$.
4. Accepted when every edge in $E$ connects two distinct vertices and no unordered pair appears more than once.
5. Accepted when, after termination, the DSU's component partition matches the connected components actually induced by $E$.
6. Accepted when, for every root $\rho$, the DSU's tracked $|C(\rho)|$ equals the number of $S$-vertices whose current root is $\rho$.
7. Accepted when every accepted edge's key was recomputed against the DSU state immediately before acceptance (no edge is accepted on a stale, pre-union key).