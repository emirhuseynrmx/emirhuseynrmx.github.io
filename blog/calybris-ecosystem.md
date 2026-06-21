# I Built a Proof-Carrying Decision Engine. Here's What It Powers.

*Every decision — AI model call, trading signal, churn intervention — should carry auditable evidence of its expected value. That principle drove me to build the Calybris ecosystem.*

---

I'm Emir Hüseyin İnci, an ML engineer based in Bursa, Turkey. I work across Rust and Python — from low-latency gateway code to causal uplift models. Over the past year, I've been building a family of products around a single core idea: **decisions should carry proof.**

Not predictions. Not scores. Not dashboards that show what happened. Proof-carrying decisions that explain *why* a specific action was taken, what it cost, what the alternatives were, and whether the evidence was strong enough.

This is the Calybris ecosystem. Here's what it looks like.

---

## The Core: Calybris Engine

Calybris is a domain-neutral prescriptive decision engine written in Rust. Every decision that passes through it gets:

- A **cost estimate** (what this decision costs to execute)
- A **risk penalty** (what could go wrong)
- A **quality floor** (minimum acceptable outcome)
- A **confidence score** (how sure we are)
- A **decision fingerprint** (SHA-256, replayable)
- A **WAL entry** (durable write-ahead log)

The engine doesn't care whether the decision is "which LLM model to route this request to" or "should we intervene to retain this customer" or "does this trading signal survive falsification." The proof structure is the same.

**Benchmarks** (three-run medians, one local host — not cloud SLO claims):

| Layer | Result |
|-------|--------|
| Integer kernel | 4.46M decisions/s |
| Durable HTTP (c=128) | 4,188 req/s |
| HTTP p99 | 54.1 ms (15,000 requests, 0 failed) |
| Durable WAL | 3,134 events/s |

We publish the bad run too. The current-host `sync_data` barrier p99 was 1.57s — an isolated stable reference measured 9,861 durable events/s at 83.8ms. Storage contention is an operational fact, not a footnote.

---

## Product 1: GOVERIS — AI Cost Governance Gateway

**The problem:** LLM bills are made of thousands of unreviewed decisions. Teams see the invoice but not the call-level economics — why a premium model was used, whether a cheaper model would satisfy the quality floor, which tenant is creating avoidable spend.

**What GOVERIS does:** It sits between your application and the LLM provider. For every model call, it evaluates: requested model, selected model, risk, confidence, tenant budget, expected value. Then it decides: **allow, downgrade, block, cache, or retry.**

The first product isn't a chat wrapper. It's a private shadow-replay pilot. A Docker image runs inside your VPC, observes decision envelopes (no prompt content), and produces an audit package: PDF, HTML, JSON, with artifact hashes.

**Key design decisions:**
- OpenAI-compatible API — drop-in replacement
- Metadata-only mirror — prompts and responses stay in your environment
- Shadow mode first — observe and replay before enforcing
- Multi-provider — works with OpenAI, Anthropic, and Google model catalogs
- Proof-carrying — every decision gets a Calybris fingerprint

The go-to-market is audit-first: start with a 7–14 day shadow replay, produce a board-readable spend report with what-if policy scenarios, then graduate proven rules into the proxy path.

**[Try the interactive demo →](https://emirhuseyin.tech/calybris/)**

---

## Product 2: LuceThemis — Quant Signal Evidence Audit

LuceThemis is not a trading bot. It doesn't sell signals. It doesn't promise returns.

It's a **falsification engine.** It tests whether trading signals survive cost, leakage, overfit, walk-forward validation, and complexity pressure *before* capital goes in.

The core principle is MDL-inspired: more complex signals must carry stronger evidence to pass the audit gate. Kolmogorov complexity and Solomonoff induction aren't directly operational metrics — LuceThemis uses a practical proxy.

**First serious pilot (DexNight v1.0.2):**

| Metric | Result |
|--------|--------|
| Candidates audited | 215,233 |
| Unique patterns | 983 |
| Holdout return (filtered) | +8.98% |
| Holdout win rate | 84% (N=25) |
| Profit factor | 5.509 |
| Primary coverage | 80.59% |

Important caveat: the sample is too small for a capital-grade claim. The collection window was 6.98 hours against a 72-hour minimum. This is pilot evidence, not production proof. LuceThemis does not produce investment advice — it produces evidence quality audits.

But the signal is real: the audit layer rejected its own founder's signal engine on the first serious test. That's negative for trading, positive for the product.

*"The market needs a reliable evidence standard, not more backtests."*

---

## Product 3: AeraCFO — AI Finance Reporting for SMEs

Most small businesses can't afford a full-time CFO. Their accountant reads the spreadsheet but doesn't produce strategy. AeraCFO fills that gap.

**How it works:**
1. Upload CSV or XLSX financial data
2. A 3-agent pipeline (Planner → Executor → Critic) analyzes the data
3. Planner decomposes the question, Executor runs 10 function-tools (cash flow analysis, Holt forecasting, anomaly detection, incentive matching), Critic verifies
4. Output: board-ready A4 PDF report

**Stack:** Rust + Axum + Polars on the backend, Gemini Flash for the agent loop. 23 sector-specific demo datasets. Turkish government incentive database (KOSGEB, TÜBİTAK) with IDF-weighted search.

63/63 tests passing. MIT licensed.

**[Explore AeraCFO →](https://emirhuseyin.tech/aera/)**

---

## Product 4: Aegis — Prescriptive Churn Analytics

Most churn systems stop at prediction. Aegis goes further:

```
Predict → Explain → Prescribe → Financial → Causal → Validate
```

- **Predict:** Calibrated XGBoost ensemble with isotonic calibration
- **Explain:** SHAP TreeExplainer for model interpretation + DoWhy causal analysis
- **Prescribe:** DiCE counterfactual scenarios with business-rule constraints
- **Financial:** Expected value decisioning with NPV/WACC discounting
- **Causal:** T-Learner CATE estimation + sleeping-dog detection
- **Validate:** Backtesting with PSI drift monitoring

The key insight: a customer with high churn probability isn't always worth saving. Aegis calculates Net EV = P(churn) × LTV × P(retain|action) − Cost(action). Some customers are "sleeping dogs" — intervention actually increases their churn probability. Aegis detects those.

173/173 tests passing. 94% coverage.

**[Launch the dashboard →](https://emirhuseyin.tech/aegis/app/)**

---

## Research: Criteo Uplift Modeling Benchmark

Alongside the products, I maintain a modular uplift modeling benchmark on the 7M-row Criteo dataset. Six meta-learners compared head-to-head:

| Model | Test AUUC |
|-------|-----------|
| **S-Learner** | **3,405.48** |
| T-Learner | 3,180 |
| DR-Learner | 3,120 |
| X-Learner | 3,090 |
| Causal Forest | 2,980 |
| Response baseline | 2,850 |

Main takeaway: S-Learner gave the strongest overall AUUC signal. The simple response-model baseline remained surprisingly competitive. Top-decile uplift was 6.23× with ~6,865 incremental visits.

The Causal Forest (EconML) took 3,335 seconds and 14.5 GB peak RSS. Good to know before you reach for it.

---

## The Stack

Everything is built with two languages:

**Rust** — Axum, Tokio, Polars, ed25519 signatures, WAL. Used for anything latency-sensitive or infrastructure-grade.

**Python** — LightGBM, XGBoost, PyTorch, DoWhy, EconML, SHAP, DiCE. Used for ML research and modeling.

I don't use LangChain or Pandas in production code. Polars for data, typed configs (Pydantic) for correctness, deterministic seeding for reproducibility.

---

## What's Next

GOVERIS is the most commercially viable product in the ecosystem. The immediate goal is 3–5 paid shadow replay pilots with real LLM traffic. If the audit shows 10–30% cost reduction with task success within 1–2% of baseline, that's the proof point for a pre-seed raise.

LuceThemis needs a longer collection window — 72+ hours of continuous signal data — before the audit report can be called serious. The architecture works; the evidence depth doesn't yet.

AeraCFO and Aegis are MIT-licensed tools that demonstrate the decision infrastructure thesis. They're not direct revenue targets — they're proof that the Calybris pattern (proof-carrying, domain-neutral, auditable) works across domains.

---

*If you're running LLM workloads and want to see where your spend actually goes, I'm offering private shadow replay pilots. No prompt capture, no log export — just metadata-only observation inside your VPC.*

*Send your monthly call volume and provider stack: [emirhuseyininci@gmail.com](mailto:emirhuseyininci@gmail.com?subject=GOVERIS%20Shadow%20Replay%20Pilot)*

*Portfolio: [emirhuseyin.tech](https://emirhuseyin.tech)*
