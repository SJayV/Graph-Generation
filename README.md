# Graph Generation

Greedy edge growth on a fixed vertex set, ranked by a field-based
priority score shaped by a special subset $S$.

## Formalization

### Graph

- **Vertices**
  - pairwise-distinct positions

$$V\subseteq\{0,\dots,L\}^2\cap\mathbb N^2,\quad |V|=n$$

- **Edges**
  - unordered
  - no self-loops
  - no duplicates

$$E\subseteq\binom V2$$

- **Edge weight**

$$w(u,v) = \lVert u-v\rVert_2$$

- **Sparsity**
  - control of target edge count
  - cap for $m > \binom n2$

$$r\in\mathbb R_+,\quad m=\lfloor rn\rfloor$$
$$|E| = \min(m,\binom n2)$$

- **Special subset**

$$S\subseteq V,\quad |S|=k,\quad 0\le k\le n$$

### Components

- **Root**
  - Distinct-Set-Union root of $v$

$$\rho(v)$$

- **Special subset**
  - members of $\rho$'s component

$$C(\rho) = \{v\in V\mid\text{parent}(v)=\rho\}$$

- **Merge**

$$C(\rho_{\text{new}}) = C(\rho_1)\cup C(\rho_2)$$

### Field

- **Field strength**
  - diminishing returns as component absorbs more of $S$
  - $C(\rho(v))=\emptyset$ = strength $0$ = no contribution

```math
\lambda(v,x) = \begin{cases}
\lambda & \text{component}(v) = \text{component}(x)\\
1 & \text{otherwise}
\end{cases}
```

$$\text{str}(v,x) = \sqrt{\lambda(v,x)\cdot|C(v)|}$$

- **Field value**
  - Gaussian bump around vertex, scaled with amount of connected special members
  - $\sigma$ scaled to $L$, fixed per run
  - $\mu_v$ = $v$'s fixed grid position
  - $F_{\rho(v)}(x)\ge 0$ always

```math
\kappa(v) = \begin{cases}
\kappa & v\in S\\
1 & \text{otherwise}
\end{cases}
```

$$F_{\rho(v)}(x) = \kappa(v)\cdot\text{str}(v,x)\cdot \mathcal{N}(x\mid \mu_v,\sigma^2)$$

- **Priority score**
  - symmetric
  - unbounded priority contribution / ranking value

$$\text{key}(\{u,v\}) = F_{\rho(v)}(u) + F_{\rho(u)}(v)$$

## Functionality

### Generation and Visualization

- **Vertices**
  - one dot per vertex
  - fixed grid position, no recomputed/arbitrary layout
- **Edges**
  - one at a time
  - in greedy-acceptance order
- **Recency glow**
  - glow of newly-appeared edges
  - fade over time to the same steady baseline appearance

```mermaid
graph LR
  subgraph Graph
    A((A))
    B((B))
    C((C))
    D((D))
    E((E))
    F((F))
    A --- B
    B --- C
    D --- E
  end

  subgraph "Priority List (top = highest key)"
    P1["{C,D}: key=4.8"]
    P2["{A,E}: key=3.1"]
    P3["{E,F}: key=1.6"]
    P1 --> P2 --> P3
  end

  C ~~~ P1

  classDef special fill:#ff8c00,stroke:#333,color:#fff;
  classDef normal fill:#1a99ff,stroke:#333,color:#fff;
  class A,D special;
  class B,C,E,F normal;
```

### Fragmentation Study

- **Trial proportion**
  - across $N$ independent trials at fixed $r$
  - trial true iff all of $S$ shares one root

$$\hat p(r) = \frac1N\sum_{i=1}^N \mathbb{I}\big[\rho(s)\text{ equal }\forall s\in S\big]_i$$

- **Sigmoid fit**
  - fit to $(r,\hat p(r))$ points by minimizing $\sum_i\big(p(r_i)-\hat p(r_i)\big)^2$
  - $r_0$ = estimated fragmentation threshold

$$p(r) = \frac1{1+e^{-k(r-r_0)}}$$

- **Fit example** (illustrative, $k=4$, $r_0=1.5$)
  - sample points = raw noisy $\hat p(r)$ per trial batch
  - blue curve = fitted $p(r)$

```mermaid
%%{init: {'themeVariables': {'xyChart': {'plotColorPalette': '#ff8c00, #1a99ff'}}}}%%
xychart-beta
  title "Sigmoid fit"
  x-axis "r" [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3]
  y-axis "fragmentation proportion" 0 --> 1
  line [0.0008, 0.003, 0.023, 0.08, 0.19, 0.41, 0.6, 0.72, 0.77, 0.91, 0.94, 0.97, 0.99]
  line [0.002, 0.007, 0.018, 0.047, 0.119, 0.269, 0.5, 0.731, 0.881, 0.953, 0.982, 0.993, 0.998]
```

## Implementation

### Generation-Algorithm

- **Priority list**
  - candidate pool $\binom V2$, one entry per unordered vertex pair
  - each entry ranked by its current $\text{key}(\{u,v\})$

- **Greedy growth**
  1. highest-ranked entry $\{u,v\}$ from the priority list
  2. $\{u,v\}$ as edge, merge of $\rho(u)$ and $\rho(v)$
  3. re-ranking of all remaining entries incident to $u$ or $v$
  4. iteration until $|E|=m$ or the priority list is exhausted
- **Invariants**
  - accepted pairs are never revisited
  - single edge accepted per iteration

### Fragmentation Study

- **Fit method**
  - gradient descent on $(k,r_0)$
  - minimization of $\sum_i\big(p(r_i)-\hat p(r_i)\big)^2$ over the sigmoid $p(r)$

- **Initialization**
  - $r_0\leftarrow\frac{\min(r)+\max(r)}2$
  - $k\leftarrow 1.0$

- **Per-iteration update**
  1. predicted value per point

$$p(r_i) = \frac1{1+e^{-k(r_i-r_0)}}$$

  2. error-slope term per point

$$g_i = 2\big(p(r_i)-\hat p(r_i)\big)\cdot p(r_i)\big(1-p(r_i)\big)$$

  3. gradient accumulation over all $N$ points

$$\nabla_k = \sum_i g_i\cdot(r_i-r_0), \quad \nabla_{r_0} = \sum_i g_i\cdot(-k)$$

  4. parameter update, learning rate $\eta$ scaled by point count $N$

$$k\leftarrow k-\frac{\eta}N\nabla_k, \quad r_0\leftarrow r_0-\frac{\eta}N\nabla_{r_0}$$

- **Stopping criteria**
  - $\lVert(\nabla_k,\nabla_{r_0})\rVert<$ tolerance, or
  - fixed maximum iteration count reached
</content>
</invoke>
