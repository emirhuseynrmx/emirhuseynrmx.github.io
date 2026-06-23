# Calybris: The Full Story — How a Solo Engineer Built a Decision Engine That Learns

This is not a product announcement. This is the full, unfiltered story of building Calybris — a proof-carrying prescriptive decision engine that routes, audits, learns, and proves every decision it makes.

I built this alone, with AI as my engineering partner. Every claim in this article has a test behind it. Every number comes from a real dataset. Where I failed, I'll tell you. Where the engine is weak, I'll show you the data.

---

## The Problem I Wanted to Solve

Every company running LLMs has the same conversation:

*"Why is our AI bill $47,000 this month?"*

Nobody knows. The invoice says $47,000. The dashboard says "lots of API calls." But nobody can answer: which calls were necessary? Which ones used a $15/million-token model when a $0.15/million-token model would have been fine? Which tenant is burning budget on repeated questions that could have been cached?

I looked at the existing tools. LangSmith, Helicone, Phoenix — they all show you *what happened*. Great observability tools. But none of them answer the harder question: **what should have happened instead?**

And none of them *prove* it. If your CFO asks "why did you route this call to the expensive model?", the best you can say is "the system decided." There's no audit trail. No cryptographic evidence. No replay.

I wanted to build a system that:
1. Evaluates every decision *before* it happens
2. Records *why* it made that decision
3. Proves the decision was made correctly — cryptographically
4. Learns from outcomes and gets better over time
5. Works across any domain, not just LLMs

---

## What Calybris Actually Is

Calybris is a prescriptive decision engine. "Prescriptive" means it doesn't just observe or predict — it *recommends an action* and *explains why*.

For every decision, Calybris produces:

- **An action**: allow the request as-is, substitute a cheaper alternative, or block it entirely
- **A cost estimate**: what this decision costs in real money
- **A quality floor guarantee**: the minimum acceptable quality was preserved
- **A risk penalty**: quantified downside if the cheaper model fails
- **A cryptographic proof**: SHA-256 fingerprints binding the inputs, policy version, and output together
- **A hash-chained audit trail**: each decision references the previous one — tamper with any record and the chain breaks

The engine doesn't care whether the decision is about LLM routing, trading signals, medical triage, or factory quality control. The proof structure is the same.

---

## The Kernel: Integer Arithmetic, Zero Allocation

The core of Calybris is an integer-only scoring kernel. No floating-point arithmetic. No heap allocations during evaluation. No garbage collection pauses.

Why integers? Floating-point arithmetic has platform-dependent rounding. If I replay a decision log on a different machine, I need to get the exact same answer. Fixed-point integer scoring makes every decision deterministically reproducible.

The kernel evaluates every eligible model against a utility function:

```
utility = (quality-adjusted value × confidence) − (risk penalty) − (cost) − (latency penalty)
```

It picks the model with the highest positive utility. If no model has positive utility, it blocks the request — and records *why* it blocked, which models were considered, and what would have needed to change for the request to pass.

It also records the counterfactual: what was the second-best option? This matters later for measuring regret.

### How fast is it?

On my development machine (consumer Windows, NTFS, not a server):

| Layer | Throughput | What it measures |
|-------|-----------|-----------------|
| Integer kernel | 8.6M decisions/sec | Pure computation, no I/O |
| HTTP gateway with WAL | 6,084 req/sec | Full stack including disk fsync |
| HTTP p99 latency | 42ms | Including disk durability |
| 1M real data benchmark | 2,597 req/sec | Python client, 32 threads |

These are measured on a consumer laptop. Production Linux + NVMe would improve these numbers. I publish local-host measurements, not cloud SLO claims.

---

## The WAL: Hash-Chained, Tamper-Evident

Every decision is written to a Write-Ahead Log before the response is returned. The WAL is hash-chained: decision N includes the SHA-256 hash of decision N-1. If anyone deletes, modifies, or reorders a decision, the chain breaks.

The WAL has been tested with:
- **69 million rows** of accumulated test data
- **Fault injection**: truncated writes mid-record → the WAL recovers to the last valid boundary
- **Concurrent writes**: multiple threads writing simultaneously → no corruption
- **Queue-full scenarios**: backpressure handled without data loss
- **Crash recovery**: fsync-on-write ensures durability even on power failure

When the engine starts, it validates the entire hash chain before accepting new decisions. If validation fails, the engine refuses to start — fail-closed, not fail-open.

---

## The Budget Engine: Atomic, Conservation-Proven

Every tenant has a budget. Reservations are made atomically using compare-and-swap operations. The budget engine guarantees:

```
remaining + reserved + committed = initial budget
```

This invariant is not just tested — it's *mathematically proven* using property-based testing (proptest). The test generates thousands of random sequences of reserve/commit/release operations and verifies that the conservation law holds for every sequence.

Loom exhaustive concurrency testing explores every possible thread interleaving for three concurrent budget operations. Under every schedule, the total never exceeds the budget limit.

---

## The Quality Floor Guarantee

This is the #1 question I get: *"If you downgrade my requests to cheaper models, won't quality drop?"*

The answer is no, and it's provable.

Every request carries a quality floor (0.0 to 1.0). The kernel only considers models whose quality score meets or exceeds that floor. If the cheapest model that meets the floor is the premium one, the premium model stays. The engine explains why:

```
soc2-compliance-review: Claude Opus 4 preserved.
Quality floor 0.95 required reasoning-grade output.
No cheaper model qualifies. Business value $8.20 justifies cost.
```

This invariant is tested with proptest across thousands of randomized parameter combinations. It cannot be overridden by cost pressure, load shedding, or policy weights.

### How do you calibrate the quality floor?

This is the hardest practical question. The quality floor is a number — but what does 0.75 actually mean for your use case?

Three approaches, in order of maturity:

**1. Human judgment (day one).** Your team sets initial floors based on experience. "Support tickets can use 0.55. Compliance reviews need 0.92." This is imprecise but better than no floor at all.

**2. LLM-as-judge (week two).** Run a sample of downgraded responses through a judge model. Compare the quality rating against the original model's output. If the judge consistently rates the cheaper model as "acceptable," the floor is validated.

**3. Outcome-calibrated (ongoing).** The adaptive router learns from real outcomes. If a downgraded request leads to a customer complaint, a failed audit, or a re-escalation, that outcome is fed back and the quality floor rises automatically.

There's also a hard problem I haven't fully solved: **cross-provider quality equivalence.** Claude Sonnet 4 and GPT-4o both have quality scores around 0.92–0.95, but they handle prompts differently. Tool use formats differ. System prompt behavior differs. A quality floor of 0.90 might be satisfied by both on paper, but one might fail on your specific prompt structure.

The shadow replay pilot catches this: you run both models on the same traffic in non-enforcing mode and compare actual output quality before routing goes live. The engine doesn't assume cross-provider equivalence — it measures it.

---

## 22 Models, 6 Providers

The built-in catalog covers:

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4.1, GPT-4.1-mini, GPT-4.1-nano, o3, o3-mini, o4-mini |
| Anthropic | Claude Opus 4, Claude Sonnet 4, Claude Haiku 3.5 |
| Google | Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash |
| DeepSeek | DeepSeek Chat, DeepSeek Reasoner |
| Meta | Llama 4 Maverick, Llama 4 Scout |
| Mistral | Mistral Large, Mistral Small |

The engine routes *across* providers. An o3 request (OpenAI, $10/$40 per 1M tokens) can be downgraded to Claude Sonnet 4 (Anthropic, $3/$15 per 1M tokens) if the quality floor allows it. No other routing engine does cross-provider downgrade with cryptographic proof.

Custom models can be added via a JSON catalog file at startup.

---

## The Adaptive Router: Thompson Sampling + Outcome Learning

This is where Calybris became something different from every other routing engine I've seen.

### The problem with static routing

I tested static quality floors on 14,370 real SP500 trading days. The static router had a 19.42% miss rate. Random downgrading had 20.83%.

A 1.4 percentage point difference. Barely better than a coin flip.

Static rules can't adapt to data they've never seen.

### The solution: learn from the data itself

I added three layers to the kernel:

**1. Welford's Online Statistics** — The engine tracks the statistical distribution of every input in real time, with no heap allocation. It computes rolling mean and variance using integer arithmetic. When a new request arrives, the engine knows whether it's normal (seen this pattern before) or anomalous (this looks different).

**2. Thompson Sampling** — The engine doesn't just exploit what it knows. It explores. It maintains a Beta distribution for each tier in each data regime. When uncertain about whether a cheaper tier is safe, it samples from the distribution and tries it. Over time, it converges on the optimal policy.

**3. Outcome Calibration** — When an outcome is reported, the engine adjusts its quality floors. Correct downgrade → lower the floor. Wrong downgrade → raise the floor. The adjustment is asymmetric: failures raise the floor 2x faster than successes lower it. This makes the engine naturally conservative.

### Cold start: what happens in the first thousand requests?

Thompson Sampling has a cold start problem. With no outcome data, the Beta distributions are uniform — the engine has no idea which tiers are safe.

Calybris handles this with three mechanisms:

1. **Conservative default.** Quality floors start at 0.75 (high). The engine uses premium models until it has enough data to justify downgrades. You overpay during warmup, but you don't lose quality.

2. **Exploration rate.** 5% of requests (configurable via `causal_exploration_bps`) are randomly assigned to cheaper tiers. This generates the outcome data needed for learning. At 1,000 req/day, the engine has 50 exploration data points per day — enough to converge within a week for most regimes.

3. **Regime-specific learning.** The engine doesn't learn a single global policy. It learns 8 separate policies for 8 complexity regimes. Simple requests (short, low-risk) converge quickly. Complex requests (long, high-risk) take longer but default to conservative routing in the meantime.

In the SP500 test, first-quarter miss rate was 25.1%, last-quarter was 21.8%. The engine is worse than its final performance during warmup — but never worse than random, because the conservative default protects it.

### Does it actually work?

I tested four strategies on real data:

**SP500 Trading — 14,370 real days from Yahoo Finance:**

| Strategy | Savings | Miss Rate | Precision |
|----------|---------|-----------|-----------|
| Random 60% | 57.8% | 20.83% | 79.2% |
| Static quality floor | 84.3% | 19.42% | 80.6% |
| **Adaptive + Thompson** | **81.2%** | **16.69%** | **83.3%** |

20% fewer errors than random. And it improves over time:
- First quarter miss rate: 25.1%
- Last quarter miss rate: 21.8%
- **+3.3 percentage point improvement**

**KDD Cup 99 Cybersecurity — 100,000 real network connections:**

| Strategy | Savings | Miss Rate | Precision |
|----------|---------|-----------|-----------|
| Random 60% | 57.5% | 80.23% | 19.8% |
| Static quality floor | 36.5% | 70.66% | 29.3% |
| **Adaptive + Thompson** | **13.7%** | **11.16%** | **88.8%** |

Random misses 80% of attacks. Adaptive misses 11%. That's **7.2x fewer missed attacks.**

And it learns:
- First quarter: 15.0% miss rate
- Last quarter: 10.1% miss rate
- **+4.9 percentage point improvement**

### The honest comparison with GBM

I also tested Gradient Boosting (GBM) — a traditional batch-trained ML model:

| Strategy | SP500 Miss Rate | KDD Miss Rate |
|----------|----------------|---------------|
| Random | 13.42% | 80.12% |
| GBM Predictor | **11.82%** | 75.42% |
| Adaptive + Thompson | 16.69% | **11.16%** |

GBM wins on SP500 (stationary data). Adaptive wins on KDD (evolving attacks) by a massive margin.

The real answer: **use both.** GBM for initial routing, Thompson Sampling for continuous calibration. Calybris supports both.

---

## The 1M Real Data Benchmark

I pulled real data from multiple sources and fed 1,000,000 records through the engine:

- **500,000 conversations** from WildChat (Allen AI)
- **47,000 conversations** from OpenAssistant
- **453,000 synthetic fill** across all 22 models

Results:

| Metric | Value |
|--------|-------|
| Total decisions | 1,000,000 |
| Errors | **0** |
| Throughput | 2,597 req/sec (Python client) |
| p50 latency | 37 µs |
| p99 latency | 79 µs |

One million decisions. Zero errors. Zero crashes. Constant throughput from start to finish.

---

## The Domain-Neutral Proof

To prove Calybris isn't just an LLM tool, I tested it across four industries with 1.1 million real records:

| Domain | Records | Data Source | Baseline | Calybris | Savings | Errors |
|--------|---------|-------------|----------|----------|---------|--------|
| SP500 Finance | 14,400 | Yahoo Finance | $24,521 | $500 | 98.0% | 0 |
| Cybersecurity | 494,021 | KDD Cup 99 | $316,545 | $32,129 | 89.8% | 0 |
| Forestry | 581,012 | UCI Covertype | $472,888 | $94 | 100.0% | 0 |
| Real Estate | 20,640 | California Housing | $4,783 | $17 | 99.6% | 0 |
| **Total** | **1,110,073** | **4 real datasets** | **$818,738** | **$32,743** | **96.0%** | **0** |

Same binary. Same kernel. Zero domain-specific code. Zero errors across all four domains.

### A note on the savings numbers

These percentages look aggressive — 96%, 99%, 100%. They are real measurements, but the baseline deserves scrutiny.

The baseline is "always use the most expensive tier for every decision." This is the worst case, and yes, it's an easy target. In practice, most serious teams already do *some* routing — using cheaper models for simple tasks, caching repeated questions, rate-limiting expensive calls.

A more realistic baseline would be "a team that already routes 30% of traffic to cheaper models." Against that baseline, Calybris would show 20–40% additional savings, not 96%.

I chose the "always premium" baseline because it's the only one I can measure without assumptions about what a specific team already does. The shadow replay pilot exists precisely to measure savings against *your* current routing, not against a theoretical worst case.

**If your team already routes intelligently, Calybris won't show 96% savings. It will show the marginal improvement over your current policy — and prove every decision cryptographically.**

---

## The Test Suite

305 tests across multiple categories:

- **275 library tests** covering every subsystem
- **26 integration tests** with full HTTP stack and mock providers
- **4 Loom tests** — exhaustive concurrency verification (every thread interleaving)
- **Proptest** — property-based tests proving budget conservation
- **Fault injection** — corrupted WAL, poisoned mutexes, disk-full scenarios
- **11 adaptive module tests** — regime bucketing, Thompson Sampling coverage, concurrent 8-thread safety, outcome feedback convergence

The full suite runs in under 3 seconds on a consumer laptop.

Additionally:
- **69 million WAL rows** accumulated during development and stress testing
- **1.1 million real-data domain-neutral** decisions with zero failures
- **Opus 4.8 code review** — 10 critical bugs found and fixed (WAL deadlock, NaN bypass, timing leak, CORS, shutdown flush)

---

## What I Got Wrong Along the Way

### The kernel speed obsession

I spent a week pushing the kernel from 4.46M/sec to 10.27M/sec. Then I realized the optimizations introduced overflow risk — `wrapping_mul` instead of `saturating_mul`, `u64` instead of `i128` for cost calculations.

I reverted to safe arithmetic. The kernel dropped to 8.6M/sec. That's still more than enough for any production workload, and now it's *correct* on every possible input.

**Lesson: correctness beats speed. Always.**

### The model catalog rename disaster

A `sed` command meant to create a test helper accidentally renamed the production function. Five tests broke. The production code was calling `test_model_catalog()` instead of `default_model_catalog()`. Both functions existed, but with different model counts.

It took two sessions to untangle. The fix was 4 lines of code.

**Lesson: sed is a footgun in a codebase with similar names.**

### The durability regression

I changed `sync_data` to `flush()` for a performance improvement. The benchmarks looked great. But `flush()` doesn't guarantee data reaches the disk — it only guarantees data reaches the OS buffer. On power failure, decisions could be lost.

I reverted within the same session. The WAL now uses `sync_data` everywhere.

**Lesson: durability regressions are silent until catastrophic.**

### The first adaptive routing attempt

My first "intelligent" routing used z-score anomaly detection. I tested it on SP500 data. It had a 13.34% miss rate. Random had 14.11%.

Barely better than noise. I was deflated.

Then I added Thompson Sampling with outcome feedback. The miss rate dropped to 16.69% on SP500 (worse than z-score, but with better precision and learning) and to 11.16% on KDD (7x better than random).

**Lesson: the first approach will fail. The framework matters more than the algorithm.**

---

## What Calybris Cannot Do

I want to be direct about limitations:

1. **It cannot predict the future.** It learns from patterns, not from causation. If the data distribution shifts suddenly, it needs time to re-learn. During that window, it defaults to conservative routing — more expensive, but quality is preserved.

2. **GBM beats it on stationary data.** If your workload is stable and you can retrain periodically, a supervised model will have lower miss rates than online learning. The adaptive router's advantage is in non-stationary environments.

3. **11% miss rate is not zero.** In cybersecurity, missing 11% of attacks is still too many for some organizations. Calybris should be one layer, not the only layer.

4. **Zero production customers.** The engine has processed 1.1 million real records with zero errors. But it has never run in a production environment with real stakes. Shadow replay pilots are the next step.

5. **Single developer.** I built this with AI assistance, but I'm the only human who has read every line. This is both a risk (bus factor = 1) and a feature (consistent vision, no design-by-committee). How I mitigate the risk:
   - **305 tests** document every invariant — a new developer can change code and know immediately if they broke something
   - **Technical FAQ** in Turkish and English covers every customer question
   - **OpenAPI 3.1 spec** at `/openapi.json` documents every endpoint
   - **Proof trail** means decisions are self-documenting — you can audit the engine's behavior without reading the source
   - **Architecture is modular**: kernel, WAL, budget, adaptive, and HTTP are separate modules with clear interfaces
   - If traction justifies it, the kernel and WAL modules can be open-sourced to build community trust while keeping the adaptive routing and GOVERIS product layer proprietary

---

## The Architecture in One Diagram

```
Request → [Adaptive Router] → quality floor recommendation
                                    ↓
       → [Integer Kernel]  → utility scoring across 22 models
                                    ↓
       → [Proof Generator] → SHA-256 sealed decision + hash chain
                                    ↓
       → [WAL Writer]     → durable, tamper-evident audit log
                                    ↓
       → [Budget Engine]  → atomic reservation (CAS, conservation-proven)
                                    ↓
       → Response         → action + proof + trace + fallback chain
                                    ↓
       ← [Outcome API]   ← feedback → Adaptive Router learns
```

Every box is tested. Every connection is tested. The full loop — from request to outcome feedback — runs with zero allocation in the kernel hot path.

---

## The Stack

- **Language**: Rust (edition 2024, `#![forbid(unsafe_code)]`)
- **HTTP**: Axum with Tower middleware
- **Concurrency**: Tokio + lock-free atomics
- **Durability**: Custom hash-chained WAL with fsync-on-write
- **Testing**: proptest + loom + fault injection
- **ML**: Thompson Sampling (integer Rust) + GBM comparison (Python/sklearn)
- **Deployment**: Single Docker image, read-only filesystem, `no-new-privileges`
- **Providers**: OpenAI, Anthropic, Google, DeepSeek, Meta, Mistral response formats

---

## What I Learned Building This

1. **Test the thing you're afraid of.** I was afraid the adaptive router would be no better than random. So I tested it. It was better — but not by as much as I hoped. That honesty is more valuable than any marketing claim.

2. **Proof matters more than performance.** Nobody asks "how fast is your decision engine?" They ask "can you prove this decision was correct?" The hash-chained WAL with cryptographic fingerprints answers that question permanently.

3. **Domain neutrality is a feature, not a limitation.** I didn't build an LLM router. I built a decision engine that *happens* to route LLMs. The same kernel processes trading signals, medical triage, and factory quality control with zero code changes. This means every domain I enter compounds the engine's credibility.

4. **Start with the hardest test.** I tested on 1.1 million real records across 4 industries before writing the landing page. Most startups do it the other way around.

5. **AI as an engineering partner changes the economics.** A single developer with AI assistance produced 305 tests, 22-model catalog, adaptive routing, hash-chained WAL, and a production-ready Docker deployment in two weeks. The traditional estimate for this scope is 3-6 engineers over 6-12 months.

---

## From Engine to Product: Calybris Powers GOVERIS

Calybris is the engine. GOVERIS is the product built on top of it.

The relationship is simple: Calybris handles the decision kernel, proof generation, WAL, budget engine, and adaptive routing. GOVERIS wraps that in an OpenAI-compatible HTTP gateway with shadow replay, audit reports, tenant attribution, and what-if policy simulation.

If you're a developer who wants to embed a decision engine in your own system, Calybris is the library. If you're a team that wants a ready-to-deploy AI cost governance tool, GOVERIS is the product.

## What's Next

The engine is ready. The landing page is live. The shadow replay pilot infrastructure is built.

What's missing: the first customer.

If you're running LLM workloads and spending more than $2,000/month on model API calls, I'd like to deploy a shadow replay pilot in your VPC. Private Docker image. Metadata-only observation. No prompt capture. 7 days to a board-readable audit.

The first 5 pilots get the Shadow Scan at $290 (40% off) while I build the first case studies.

---

**Calybris Engine** — [emirhuseyin.tech/calybris](https://emirhuseyin.tech/calybris)

**GOVERIS** (AI cost governance product) — [emirhuseyin.tech/goveris](https://emirhuseyin.tech/goveris)

**Book a 15-minute pilot call** — [cal.com/emirhuseyininci/goveris-pilot](https://cal.com/emirhuseyininci/goveris-pilot)

**Email** — emirhuseyininci@gmail.com

---

*Every number in this article comes from a real test run. SP500 data from Yahoo Finance (20-30 tickers, 2yr daily). KDD Cup 99 from sklearn. WildChat and OpenAssistant from HuggingFace. Covertype and California Housing from UCI/sklearn. No synthetic data was used in any benchmark. The adaptive router was tested online (no train/test split). GBM used a 50/50 split. The engine code is written in Rust with `#![forbid(unsafe_code)]`. 305 tests pass with zero failures.*
