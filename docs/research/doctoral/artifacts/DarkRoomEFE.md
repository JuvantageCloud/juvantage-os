# Dark Room EFE inequalities (Theorem B.1)

The integral below is not machine-checked. The checked statement is the discrete occupation ordering in [`coq/DarkRoom.v`](./coq/DarkRoom.v): ears pay `L` for `gap` ticks per cycle and `0` after recovery; dormancy pays `L` on every tick; for a large enough cycle count, dormancy costs more even after a constant sampling penalty.

## Extrinsic cost under pure dormancy

Obligation arrivals ~ Poisson(\(\lambda\)). Untreated breach penalty \(L\).

\[
\mathbb{E}[\text{extrinsic}]_{\pi_\varnothing}
= \int_0^T \lambda e^{-\lambda t} L \, dt
= L(1-e^{-\lambda T})
\to L \quad (T\to\infty)
\]

## Ears-on recovery

Detection period \(\Delta t\), recovery success \(p_s\) per detection while breached.

Mean breach occupation time fraction \(\approx \lambda \Delta t / p_s\) (light traffic approximation).

\[
\mathbb{E}[\text{extrinsic}]_{\pi_{\mathrm{ears}}}
\le L\cdot\frac{\lambda\Delta t}{p_s} + o(1)
\]

## Crossover

Choose \(T\) large enough that \(L(1-e^{-\lambda T}) > L\lambda\Delta t/p_s + C_{\mathrm{ep}}\).  
Then \(G_T(\pi_\varnothing) > G_T(\pi_{\mathrm{ears}})\).

## Eyes-off

\(\tilde{p}\) flat in \(o_{\mathrm{pix}}\) ⇒ removing pixel sampling cannot increase extrinsic \(G\); metabolic riders only decrease. Hence eyes-off is weakly optimal given fixed ear schedule (Thm B.2).
