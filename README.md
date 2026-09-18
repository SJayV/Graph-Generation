# Graph Generation — Priority-Weighted Edge Growth

Greedy edge growth on a fixed vertex set, ranked by a field-based
priority score shaped by a special subset $S$.

## Functionality

### Graph

- **Vertices**
  $$V\subseteq\{0,\dots,L\}^2\cap\mathbb N^2,\quad |V|=n$$
  - pairwise-distinct positions

- **Edges**
  $$E\subseteq\binom V2$$
  - unordered
  - no self-loops
  - no duplicates

- **Edge weight**
  $$w(u,v) = \lVert u-v\rVert_2$$

- **Sparsity**
  $$r\in\mathbb R_+,\quad m=\lfloor rn\rfloor$$
  - control of target edge count
  $$|E| = \min(m,\binom n2)$$
  - cap for $m > \binom n2$

- **Special subset**
  $$S\subseteq V,\quad |S|=k,\quad 0\le k\le n$$
  - control of edge placement

### Components

- **Root**
  $$\rho(v)$$
  - Distinct-Set-Union root of $v$

- **Special subset**
  $$C(\rho) = S\cap\text{component}(\rho)$$
  - special members of $\rho$'s component

- **Merge**
  $$C(\rho_{\text{new}}) = C(\rho_1)\cup C(\rho_2)$$
  - on `union`

### Field

- **Field strength**
  $$\text{str}(v) = \sqrt{|C(\rho(v))|}$$
  - diminishing returns as component absorbs more of $S$
  - $C(\rho(v))=\emptyset$ = strength $0$ = no contribution

- **Field value**
  $$F_{\rho(v)}(x) = \text{str}(v)\cdot \mathcal{N}(x\mid \mu_v,\sigma^2)$$
  - Gaussian bump around vertex, scaled with amount of connected special members
  - $\sigma$ scaled to $L$, fixed per run
  - $\mu_v$ = $v$'s fixed grid position
  - $F_{\rho(v)}(x)\ge 0$ always

### Priority score

- **Priority score**
  $$
  \begin{aligned}
  \text{key}(\{u,v\}) &= p_0 + F_{\rho(v)}(u) + F_{\rho(u)}(v) \\
  &= p_0 + \text{str}(v)\cdot\mathcal{N}(u\mid \mu_v,\sigma^2) + \text{str}(u)\cdot\mathcal{N}(v\mid\mu_u,\sigma^2) \\
  &= p_0 + \mathcal{N}(u\mid\mu_v,\sigma^2)\cdot\big(\text{str}(v)+\text{str}(u)\big)
  \end{aligned}
  $$
  - symmetric
  - unbounded priority contribution / ranking value

### Fragmentation study

- **Trial proportion**
  $$\hat p(r) = \frac1N\sum_{i=1}^N \mathbb 1\big[\rho(s)\text{ equal }\forall s\in S\big]_i$$
  - across $N$ independent trials at fixed $r$
  - trial true iff all of $S$ shares one root

- **Sigmoid fit**
  $$p(r) = \frac1{1+e^{-k(r-r_0)}}$$
  - fit to $(r,\hat p(r))$ points by minimizing $\sum_i\big(p(r_i)-\hat p(r_i)\big)^2$
  - $r_0$ = estimated fragmentation threshold
