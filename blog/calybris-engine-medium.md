# I Built a Decision Engine That Proves Why It Said No

*Every AI model call costs money. Most teams find out how much after the invoice arrives. I built an engine that evaluates every call before it happens — and proves why.*

---

Most LLM cost discussions start with "we're spending too much on GPT-4." But spending isn't the problem. **Unaudited spending** is the problem.

When your support team routes 50,000 tickets through Claude Opus and nobody knows whether Haiku would have been fine — that's not a cost problem. That's a governance problem. And governance problems don't get fixed by switching models. They get fixed by making every decision auditable.

That's what Calybris does.

---

## What Calybris Is

Calybris is a prescriptive decision engine. It sits between the decision ("which model should handle this request?") and the execution ("send it to the provider").

For every decision, it produces:

- **An action**: allow, downgrade, block, cache, or retry
- **A cost estimate**: what this decision costs in real money
- **A risk penalty**: what could go wrong if the model fails
- **A quality floor**: the minimum acceptable outcome
- **A cryptographic fingerprint**: proof that this decision was made by this policy at this time

The engine doesn't care whether the decision is about LLM routing, trading signals, or churn interventions. The proof structure is the same.

---

## Why Proof Matters

Most routing systems are black boxes. A request comes in, a model gets selected, nobody knows why. If something goes wrong — an expensive model was used for a $0.05 task, or a cheap model was used for a compliance review — there's no audit trail.

Calybris chains every decision into a hash-linked log. Decision 47,291 references the hash of decision 47,290. If anyone tampers with the log — deletes a decision, changes a cost — the chain breaks. This isn't theoretical. We verify the chain on every startup.

**The practical benefit**: when your CFO asks "why did we spend $4,200 on AI last month?", you don't give them a dashboard. You give them a replayable audit trail where every dollar is traceable to a specific tenant, use case, model, and policy decision.

---

## The Integer Kernel

The core of Calybris is an integer-only scoring kernel. No floating-point in the hot path. No heap allocations during evaluation.

Why integers? Because floating-point arithmetic is non-deterministic across platforms. The same inputs can produce different results on different CPUs. For a proof-carrying system, that's unacceptable. If I replay your decision log on a different machine, I need to get the same answer.

The kernel evaluates every eligible model against a utility function:

```
utility = (quality-adjusted value) − (risk penalty) − (cost) − (latency penalty)
```

It picks the model with the highest utility. If no model has positive utility, it blocks the request. It also tracks the **counterfactual** — what would the second-best model have been? This matters for measuring regret later.

**Performance**: 8.6 million decisions per second on a single core with overflow-safe arithmetic. Three-run median, one local host. Not a cloud SLO claim.

---

## What Happens When You're Wrong

Every routing system makes mistakes. The question is whether you can measure them.

Calybris includes an outcome tracking system. After a decision is executed and the result is known — the customer was satisfied, the contract review was accurate, the support ticket was resolved — you feed that outcome back. The engine computes **regret**: the difference between what you earned and what the best alternative would have earned.

This isn't a simple comparison. It uses importance-weighted estimation to correct for the fact that you only observe outcomes for the model you actually chose, not the alternatives. The technique is called doubly-robust off-policy evaluation — it's the same approach Netflix uses for recommendation system evaluation.

**What it doesn't do**: it doesn't automatically change the policy. That's intentional. Automated policy optimization in a financial system is a recipe for runaway feedback loops. Calybris measures. The human decides.

---

## Shadow Before Enforce

The worst thing a cost governance system can do is break production on day one. Calybris solves this with staged rollout.

You start in shadow mode. The engine evaluates every request but doesn't enforce anything. Your production traffic flows unchanged. Meanwhile, Calybris builds a log of what it *would have done* — which calls it would have downgraded, which it would have blocked, how much it would have saved.

After enough shadow traffic (configurable, default 1,000 decisions), you can stage a candidate policy. The engine runs both policies in parallel — production and candidate — and counts the mismatches. If the candidate would have made different decisions for 15% of traffic, you know before you flip the switch.

Only after the candidate survives shadow evaluation do you promote it. And even then, you can roll back to any previous snapshot with one API call.

---

## Safety Gates

Some decisions should never be made by a scoring function. Calybris enforces hard limits that no policy can override:

- **Risk above threshold**: blocked, no exceptions
- **Confidence below threshold**: blocked, no exceptions  
- **Cost exceeds business value**: blocked, no paid model will be selected
- **Non-finite inputs**: rejected (NaN, infinity — these crash systems that don't check)

These gates are fail-closed. If the engine can't evaluate a request — corrupted input, missing metadata, budget system unavailable — it blocks. Never allow-by-default.

---

## What Teams Actually See

The output of a Calybris evaluation isn't a score. It's a structured decision with enough context for a non-engineer to understand why.

A typical audit finding looks like:

> **62% of support-emea traffic uses Claude Opus ($15/M tokens) for routine refund questions.** Calybris policy evaluation shows these calls satisfy the quality floor with Claude Sonnet ($3/M tokens). Projected monthly savings: $1,420. No quality degradation detected in shadow replay.

Or:

> **SOC2 compliance review calls preserved on Claude Opus.** Quality floor 0.95, workload criticality "critical", business value $8.20/call. Cost is justified by policy. No downgrade recommended.

Or:

> **3 high-risk vendor bank change requests blocked per week.** Risk score 0.94, confidence 0.41. These requests carry prompt-injection signals and fail the admission boundary. Recommended: human review pipeline.

The engine doesn't just say "downgrade." It says "downgrade because the quality floor is 0.62 and Sonnet scores 0.78 on this use case, saving $0.0234 per call across 50,000 monthly calls."

---

## The Numbers Behind the Landing Page

Our sample audit (500,000 synthetic decisions, published dataset, deterministic seed) shows:

- **Requested baseline**: $4,796.52
- **After GOVERIS policy**: $3,196.55
- **Savings rate**: 33.36%

We publish this as a catalog estimate, not a production claim. The savings are specific to the synthetic workload distribution (5 tenants, 5 use cases, realistic token/volume mix). Your production savings will be different. That's why we run a pilot before making claims.

**What we don't publish**: the kernel's internal constraint ordering, the exact penalty multipliers, or the exploration sampling mechanism. Those are the engine's competitive advantage.

---

## Built to Survive

The engine is written in Rust. Zero unsafe code. 294 tests, including:

- **Fault injection**: what happens when the disk corrupts mid-write? The WAL truncates to the last valid event and continues.
- **Property-based testing**: random sequences of budget operations never produce a negative balance. Proved across thousands of generated test cases.
- **Exhaustive concurrency testing**: three threads racing to reserve budget. Under every possible thread interleaving, the total never exceeds the limit.
- **Adversarial inputs**: NaN costs, u32::MAX token counts, empty requests, malformed JSON. The engine rejects all of them without panicking.

The test suite runs in 1 second. Every test is a proof of a specific invariant, not a check that "it works."

---

## What's Next

Calybris powers [GOVERIS](https://emirhuseyin.tech/goveris/), an AI cost governance product for teams running LLM workloads. The same engine also powers quant signal auditing (LuceThemis) and financial analytics (AeraCFO).

If you're running LLM workloads and want to see where your spend actually goes, we offer 7-day shadow replay pilots. Private Docker deployment. Metadata-only observation. No prompt capture.

[emirhuseyininci@gmail.com](mailto:emirhuseyininci@gmail.com?subject=Calybris%20Inquiry) · [emirhuseyin.tech](https://emirhuseyin.tech)

---

## GPT Image Prompts (for article visuals)

### Visual 1: Hero / Cover Image
```
Minimalist dark technical illustration. A central golden geometric shape (hexagonal prism) labeled "CALYBRIS" with glowing golden edges. From it, five thin golden lines radiate outward to smaller nodes labeled: "allow", "downgrade", "block", "cache", "retry". Background is pure black (#0a0a0a) with a subtle dot grid. Style: engineering blueprint meets luxury brand. Colors: gold (#c8a03c) on black. No text except labels. 16:9 aspect ratio.
```

### Visual 2: Decision Chain Diagram
```
Technical diagram on dark background. A horizontal chain of 5 connected blocks, each labeled with a sequence number (47289, 47290, 47291, 47292, 47293). Each block has a small SHA-256 hash snippet below it. Golden lines connect each block to the next, showing the hash chain. One block in the middle glows brighter, showing: "action: downgrade, model: opus→sonnet, cost: -$0.023, tenant: support-emea". Style: monospace font, dark terminal aesthetic, gold highlights. 16:9.
```

### Visual 3: Utility Scoring Visualization
```
Dark background bar chart showing 4 horizontal bars for 4 models: "Claude Opus" (long bar, high cost, labeled $0.84), "Claude Sonnet" (medium bar, marked as SELECTED with golden glow, labeled $0.12), "GPT-4o-mini" (short bar, labeled "quality floor not met" in red), "Semantic Cache" (tiny bar, labeled "not eligible"). Each bar is segmented: blue=quality value, red=risk penalty, amber=cost. The selected bar has a golden checkmark. Style: clean data visualization, monospace labels, dark theme.
```

### Visual 4: Shadow vs Production Split
```
Technical split-screen diagram on dark background. Left side labeled "PRODUCTION" shows a straight arrow from "Request" to "Provider" (white/gray). Right side labeled "SHADOW" shows the same arrow but passing through a golden hexagonal node labeled "CALYBRIS" which outputs a golden document icon labeled "Audit Trail". Both sides share the same input. A subtle golden dotted line connects them labeled "metadata-only mirror". Style: clean architecture diagram, dark background, gold accents. 16:9.
```

### Visual 5: Test Infrastructure Pyramid
```
Dark background pyramid diagram with 4 layers. Bottom (widest): "183 unit + integration tests" in gray. Second layer: "28 handler adversarial tests" in amber. Third layer: "15 fault injection + proptest" in gold. Top (smallest): "4 loom exhaustive concurrency" in bright gold with a subtle glow. To the right, a vertical text reads "231 total · 1.05 seconds · 0 failures". Style: minimalist, geometric, monospace font, dark theme with gold gradient bottom-to-top.
```

### Visual 6: Case Study Savings
```
Dark background infographic with 3 cards side by side. Card 1: "SaaS Support" with a large "$1,420/mo saved" in gold, below it "50K calls · 62% downgraded · quality unchanged" in gray. Card 2: "Legal Copilot" with "$340/mo + risk blocked" in gold, "8K calls · Opus preserved for contracts" in gray. Card 3: "Agent Workflow" with "$8,600/mo saved" in gold, "200K calls · 41% cached · 23% downgraded" in gray. Each card has a thin golden top border. Style: clean, corporate, monospace numbers, dark background. 16:9.
```

---

## Links

**Calybris Engine** — Technical deep-dive, architecture, benchmarks, test infrastructure:
[emirhuseyin.tech/calybris](https://emirhuseyin.tech/calybris/)

**GOVERIS** — AI cost governance product, interactive demo, pricing, shadow replay pilot:
[emirhuseyin.tech/goveris](https://emirhuseyin.tech/goveris/)

**Portfolio** — Full Calybris ecosystem, all products, research:
[emirhuseyin.tech](https://emirhuseyin.tech)
