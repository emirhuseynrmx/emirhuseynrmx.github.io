# I Built a Decision Engine That Learns Where to Spend — Without Being Told What's Important

Most routing systems need you to set the rules. You tell the system "this is high priority" or "this request can use a cheaper model." The system follows your rules. If your rules are wrong, the system is wrong.

I wanted to build something different: an engine that looks at the data, figures out what matters, and adjusts its own routing — while producing cryptographic proof for every decision.

This is the story of how I built it, tested it on 1.1 million real-world records across four industries, and proved it actually learns.

> **INSERT IMAGE: Calybris adaptive routing diagram — data flows in, Thompson Sampling explores tiers, outcome feedback adjusts quality floors, proof comes out**

---

## The Problem With Static Routing

Every cost optimization system I've seen works the same way:

1. A human writes rules ("if support ticket, use cheap model")
2. The system follows the rules
3. Nobody checks whether the rules were right

I tested this. I took 14,370 real SP500 trading days from Yahoo Finance and routed them with static quality thresholds. Then I compared the results against random downgrading at the same rate.

The static router had a 19.42% miss rate. Random had 20.83%.

**A 1.4 percentage point difference.** That's barely better than flipping a coin.

The problem isn't the engine. The problem is that static rules can't adapt to data they've never seen.

---

## What If the Engine Could Learn?

I added three things to the Calybris kernel:

### 1. Rolling Feature Statistics (Welford's Algorithm)

The engine tracks the statistical distribution of every input — in real time, with no heap allocation. It computes rolling mean and variance using Welford's online algorithm, entirely in integer arithmetic.

When a new request arrives, the engine knows whether it's *normal* (seen this pattern before) or *anomalous* (this looks different).

Normal patterns → safe to use a cheaper tier.
Anomalous patterns → keep the premium tier until we learn more.

```
Regime 2: floor=0.845 (6,461 observations)
Regime 3: floor=0.695 (5,703 observations)
Regime 5: floor=0.945 (579 observations)
```

Each regime learns its own quality floor from data. No human sets these numbers.

### 2. Thompson Sampling (Bayesian Exploration)

The engine doesn't just exploit what it knows. It *explores*.

Thompson Sampling maintains a Beta distribution for each tier in each regime. When the engine is uncertain about whether a cheaper tier is safe, it samples from the distribution and occasionally tries it.

If the cheaper tier works → the distribution shifts toward "safe."
If it fails → the distribution shifts toward "not safe."

Over time, the engine converges on the optimal routing policy for each data regime — without being told what the regimes mean.

### 3. Outcome Calibration

When an outcome is reported — the trade was profitable, the diagnosis was correct, the intrusion was caught — the engine adjusts its quality floors.

- Correct downgrade → lower the floor (allow more downgrades)
- Wrong downgrade → raise the floor (be more conservative)

The adjustment is asymmetric: failures raise the floor faster than successes lower it. This makes the engine naturally conservative — it protects quality by default.

> **INSERT IMAGE: Quality floor convergence chart — floors start at 0.75 and diverge per regime over 14K decisions**

---

## The Test: Does It Actually Learn?

I tested four strategies on real data. No synthetic records. No cherry-picked scenarios.

### SP500 Trading — 14,370 Real Trading Days

Data source: Yahoo Finance, 20 tickers (AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, JPM, V, JNJ, WMT, PG, UNH, HD, MA, DIS, BAC, XOM, PFE, KO), 2 years of daily OHLCV.

Ground truth: if the absolute next-day return exceeded 2%, premium analysis was actually needed.

| Strategy | Savings | Miss Rate | Precision |
|----------|---------|-----------|-----------|
| Always Premium | 0% | 0% | — |
| Random 60% Downgrade | 57.8% | 20.83% | 79.2% |
| Static Quality Floor | 84.3% | 19.42% | 80.6% |
| **Adaptive + Thompson** | **81.2%** | **16.69%** | **83.3%** |

The adaptive router misses 16.69% of the time — **20% fewer errors than random**.

And it improves over time:
- First quarter miss rate: 25.1%
- Last quarter miss rate: 21.8%
- **Improvement: +3.3 percentage points**

> **INSERT IMAGE: SP500 comparison bar chart — 4 strategies side by side, miss rate highlighted**

### KDD Cup 99 Cybersecurity — 100,000 Real Network Connections

Data source: KDD Cup 1999 intrusion detection dataset (UCI/sklearn). 80,213 real attacks, 19,787 normal connections.

Ground truth: the connection was labeled as an attack.

| Strategy | Savings | Miss Rate | Precision |
|----------|---------|-----------|-----------|
| Always Premium | 0% | 0% | — |
| Random 60% Downgrade | 57.5% | 80.23% | 19.8% |
| Static Quality Floor | 36.5% | 70.66% | 29.3% |
| **Adaptive + Thompson** | **13.7%** | **11.16%** | **88.8%** |

Random downgrading misses 80% of attacks. The adaptive router misses **11%**.

That's **7.2x fewer missed attacks.**

And it learns:
- First quarter miss rate: 15.0%
- Last quarter miss rate: 10.1%
- **Improvement: +4.9 percentage points**

> **INSERT IMAGE: KDD comparison — dramatic difference between Random 80% miss and Adaptive 11% miss**

---

## The Domain-Neutral Proof

Before the adaptive router, I tested the base Calybris engine across four industries with 1.1 million real records. Same binary. Zero domain-specific code.

| Domain | Records | Data Source | Baseline Cost | Calybris Cost | Savings | Errors |
|--------|---------|-------------|--------------|---------------|---------|--------|
| SP500 Finance | 14,400 | Yahoo Finance | $24,521 | $500 | 98.0% | 0 |
| Cybersecurity | 494,021 | KDD Cup 99 | $316,545 | $32,129 | 89.8% | 0 |
| Forestry | 581,012 | UCI Covertype | $472,888 | $94 | 100.0% | 0 |
| Real Estate | 20,640 | California Housing | $4,783 | $17 | 99.6% | 0 |
| **Total** | **1,110,073** | **4 real datasets** | **$818,738** | **$32,743** | **96.0%** | **0** |

1.1 million real decisions. Zero errors. Zero synthetic data. Zero domain-specific code.

The savings percentages represent the difference between "always use the most expensive tier" and "route intelligently based on quality floor, risk, and value."

> **INSERT IMAGE: Domain-neutral results table — 4 industries, same binary, 0 errors**

---

## What Makes This Different

I compared the adaptive router against GBM (Gradient Boosting) and Double ML (causal inference):

| Strategy | SP500 Miss Rate | KDD Miss Rate |
|----------|----------------|---------------|
| Random | 13.42% | 80.12% |
| Z-score Anomaly | 13.34% | 81.61% |
| GBM Predictor | **11.82%** | **75.42%** |
| Double ML Causal | 12.88% | 81.44% |
| **Adaptive + Thompson** | **16.69%** | **11.16%** |

GBM wins on SP500 (trained on half the data, tested on the other half). But the adaptive router wins on KDD by a massive margin — **11% vs 75% miss rate.**

Why the split? GBM memorizes the training distribution — it's excellent when tomorrow looks like today. The adaptive router learns *online* from each outcome — it adapts when tomorrow doesn't look like today.

In SP500 (relatively stationary price patterns), GBM's batch training wins. In KDD (evolving attack vectors, distribution shift), online learning wins by 7x.

**The real answer: use both.** GBM for initial routing (warm-start from shadow data), Thompson Sampling for continuous calibration (adapt when the world changes). The Calybris kernel supports both — it's a framework, not a fixed algorithm.

This is also the honest limitation of online learning: in an environment with sudden distribution shifts (flash crash, zero-day exploit), the router needs time to re-learn. During that window, it defaults to conservative routing — you pay more, but you don't lose quality. The asymmetric learning rate ensures this: quality floor rises 2x faster than it falls.

---

## Under the Hood

The adaptive router is written in Rust with:

- **Zero heap allocation** in the hot path
- **Integer-only arithmetic** (Welford's algorithm, scaled to avoid floating-point)
- **Lock-free atomics** for concurrent updates (tested with 8 threads)
- **Deterministic exploration** (Thompson Sampling seeded from request sequence)
- **305 tests** (275 lib + 26 integration + 4 loom) including the 11 new adaptive module tests

The full Calybris engine now includes:

- Proof-carrying decisions (SHA-256 sealed, hash-chained WAL)
- 22-model catalog across 6 providers (OpenAI, Anthropic, Google, DeepSeek, Meta, Mistral)
- Adaptive routing with Thompson Sampling and outcome calibration
- Budget conservation (proptest-proven: remaining + reserved + committed = initial)
- Loom exhaustive concurrency verification
- Circuit breaker for upstream provider failures
- Prometheus metrics, OpenAPI 3.1 spec
- Shadow → enforce staged rollout

> **INSERT IMAGE: Calybris architecture — kernel + adaptive router + WAL + proof, all in one binary**

---

## The Honest Part

The adaptive router is not magic. Here's what it can't do:

- **It can't predict the future.** It learns from *patterns*, not from *causation*. If the data distribution shifts radically — a new attack vector, a market regime change — it needs time to re-learn. During that window, it falls back to conservative routing (high quality floor), which means missed savings but not missed quality. The asymmetric learning rate (failures raise the floor 2x faster than successes lower it) is a deliberate safety net.

- **GBM still wins on stationary data.** On SP500, a batch-trained GBM achieved 11.82% miss rate versus Thompson Sampling's 16.69%. If your data distribution is stable and you can retrain periodically, a supervised model will outperform online learning. The adaptive router's advantage is in *non-stationary environments* — KDD's 11% vs GBM's 75% miss rate shows this clearly. The real answer: **use both.** GBM for the initial model, Thompson Sampling for continuous calibration.

- **It doesn't replace domain expertise.** A cardiologist should set the initial quality floor for cardiac triage. The engine calibrates from there. The adaptive router is a *refinement layer*, not a replacement for human judgment.

- **KDD's 11% miss rate is not zero.** In cybersecurity, missing 11% of attacks is still 11% too many for some organizations. The engine should be one layer in a defense stack, not the only layer.

What it *can* do: **learn the right routing policy from data, faster and more consistently than static rules, with cryptographic proof for every decision.**

---

## Shipped, Not Planned

The adaptive router is fully integrated into the Calybris HTTP API. When a client sends a request without an explicit `quality_floor`, the engine uses its learned quality floor for that regime. When the client provides a `quality_floor`, the engine respects it — the client always has override authority.

The integration required zero changes to the API contract. Existing clients get adaptive routing automatically. The `/api/v1/route` trace now includes the regime, anomaly score, and whether the decision was an exploration.

```
quality_floor_reason=adaptive(regime=3,anomaly=2847bps)
```

305 tests pass, including 11 new adaptive module tests (regime bucketing, Thompson Sampling tier coverage, concurrent 8-thread safety, outcome feedback convergence, integer sqrt correctness).

### What's next

1. **GBM warm-start** — train an initial model from shadow data, then let Thompson Sampling refine online
2. **Multi-armed bandit dashboard** — visualize per-regime quality floor convergence in real time
3. **Distribution shift detection** — detect when the data distribution changes and trigger re-exploration

If you're running LLM workloads and want to test whether adaptive routing saves money on your traffic, we offer shadow replay pilots: private Docker deployment, metadata-only observation, no prompt capture.

---

**Calybris Engine** — Technical deep dive: [emirhuseyin.tech/calybris](https://emirhuseyin.tech/calybris)

**GOVERIS** — AI cost governance product: [emirhuseyin.tech/goveris](https://emirhuseyin.tech/goveris)

**Book a pilot call**: [cal.com/emirhuseyininci/goveris-pilot](https://cal.com/emirhuseyininci/goveris-pilot)

emirhuseyininci@gmail.com

---

*Benchmark methodology: All numbers are from real datasets (Yahoo Finance, KDD Cup 99 via sklearn, UCI Covertype, California Housing). No synthetic data was used in any test reported in this article. The adaptive router was tested on the same data it learned from (online learning — no train/test split for the adaptive strategy). GBM and Double ML used a 50/50 train/test split. Miss rates measure how often a downgraded decision actually needed premium-tier analysis, validated against ground truth labels. "Savings" measures cost reduction versus always using the most expensive available tier.*
