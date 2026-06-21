# 230 Tests, 0 Failed: How I Torture-Test a Decision Engine

*Most test suites verify that code works. Mine verifies that code survives.*

---

I build [Calybris](https://emirhuseyin.tech/engine/), a proof-carrying decision engine in Rust that powers AI cost governance, quant signal auditing, and financial analytics. Every decision that passes through it gets a cryptographic fingerprint, a cost estimate, a risk penalty, and a durable audit trail.

That's the kind of system where "it works on my machine" is not enough. If the WAL (Write-Ahead Log) loses a single event, a customer's audit trail has a hole. If the budget engine allows a NaN through, someone gets free LLM calls. If the constant-time comparison leaks key length, an attacker knows exactly how long your API key is.

So I wrote tests that try to break it.

```
$ cargo test

running 230 tests
test result: ok. 230 passed; 0 failed; 0 measured
finished in 1.05s
```

Here's what those 230 tests actually do.

---

## Layer 1: Fault Injection (WAL)

The Write-Ahead Log is the most critical component. Every decision gets appended to a hash-chained JSONL file. If the process crashes mid-write, recovery must truncate to the last valid event and continue the chain.

I don't test whether the WAL can write. I test whether the WAL survives when things go wrong.

### Test: Truncated Last Byte

```
WAL file on disk:
  {"sequence":1,"event_hash":"a3f2...","decision":{...}}\n
  {"sequence":2,"event_hash":"b7c1...","decision":{...}}\n
  {"sequence":3,"event_hash":"d9e4...","decision":{...    ← missing }}\n

Recovery should:
  ✓ Detect incomplete JSON on line 3
  ✓ Truncate file to end of line 2
  ✓ Return (sequence=2, hash="b7c1...")
  ✓ Next write continues from sequence 3
```

```rust
#[test]
fn test_wal_recovery_truncates_when_last_byte_is_missing() {
    // Write 3 valid events, truncate last byte
    // Recovery returns (2, hash_of_event_2)
    // File is truncated to valid boundary
}
```

### Test: Zero-Byte Corruption Mid-Chain

```
WAL file:
  event 1: valid  ✓
  event 2: bytes 50-60 overwritten with 0x00  ✗
  event 3: valid JSON but hash chain broken

Recovery should:
  ✓ Parse event 1 successfully
  ✗ Detect corruption at event 2
  ✓ Return error (not silently skip)
```

### Test: 8 Threads × 100 Records

```
Thread 1 ──→ record, record, record, ... (100x)
Thread 2 ──→ record, record, record, ... (100x)
   ...
Thread 8 ──→ record, record, record, ... (100x)

After all complete:
  ✓ Exactly 800 events in WAL
  ✓ Valid hash chain (no gaps, no duplicates)
  ✓ Every sequence number present once
```

### Test: Queue Full Under Pressure

```
WAL queue capacity: 2

  try_send(event_1) → Ok       queue: [■□]
  try_send(event_2) → Ok       queue: [■■]
  try_send(event_3) → Err      queue: [■■] (not blocking!)

  ✓ Returns WalRecordError (not deadlock)
  ✓ queue_depth == 2 (not 3)
  ✓ failed_events counter incremented
```

This test catches a real bug I fixed: the original code used blocking `send()` which could deadlock the entire tokio thread pool if the writer died with a full queue. Changed to `try_send()`.

---

## Layer 2: Property-Based Testing (Budget Engine)

Unit tests check specific cases. Property tests check invariants across *all possible inputs*.

### The Invariant

```
For any sequence of reserve/commit/release/resize operations:

  tenant_balance >= 0        (budget never goes negative)
  balance + Σ(reservations) == initial_budget   (money is conserved)
  no reservation exists after commit or release  (no leaks)
```

### Proptest: Random Operation Sequences

```rust
proptest! {
    #[test]
    fn budget_never_goes_negative_under_random_operations(
        initial_budget in 100.0f64..10000.0,
        ops in prop::collection::vec(
            (0u8..4, 0.01f64..500.0),  // (op_type, amount)
            1..50                       // 1-50 operations
        )
    ) {
        // Execute random sequence
        // Assert: balance >= 0 ALWAYS
    }
}
```

This generates thousands of random operation sequences and verifies the invariant holds for every one. It found no violations — the CAS loop in `try_reserve` correctly prevents overspend.

### Proptest: Poison Float Values

```rust
proptest! {
    #[test]
    fn budget_nan_inf_never_corrupt_state(
        poison_value in prop_oneof![
            Just(f64::NAN),
            Just(f64::INFINITY),
            Just(f64::NEG_INFINITY),
            Just(-0.0),
            Just(f64::MIN),
            Just(f64::MAX),
        ]
    ) {
        // Try every budget operation with poison value
        // Assert: no panic, no corruption, budget finite and >= 0
    }
}
```

This caught a real bug: `NaN` mapped to `0` microcents through `value.max(0.0)`, which meant a NaN actual cost would refund the entire reservation — free LLM calls. Fixed by making `cents_to_microcents` return `Result` and rejecting non-finite inputs.

---

## Layer 3: Exhaustive Concurrency (Loom)

`cargo test` runs tests on one thread schedule. [Loom](https://github.com/tokio-rs/loom) explores *every possible interleaving*.

### Test: Three-Way Reservation Race

```
Budget: 100 microcents
Thread A: try_reserve(40)
Thread B: try_reserve(40)
Thread C: try_reserve(40)

Under ALL possible interleavings:
  ✓ At most 2 reservations succeed (40+40 ≤ 100)
  ✓ Third always gets Insufficient
  ✓ Budget never goes below 0
  ✓ No deadlock in any interleaving
```

```rust
#[test]
fn loom_three_way_reservation_never_overspends() {
    loom::model(|| {
        let budget = Arc::new(AtomicI64::new(100));
        // ... spawn 3 threads, each trying to CAS 40
        // Assert: total reserved ≤ 100
    });
}
```

Loom doesn't sample — it exhaustively enumerates. If there's a race condition, it finds it.

### Test: Concurrent Resize vs. Commit

```
Thread A: try_resize_reservation(upsize by 50)
Thread B: commit(actual_cost = 30)

Under ALL interleavings:
  ✓ No double-spend
  ✓ Budget balance consistent
  ✓ No deadlock
```

---

## Layer 4: Handler Adversarial Testing

The HTTP handler is the attack surface. These tests send malformed, oversized, and edge-case requests.

### Test: u32::MAX Token Count

```
Request: { "model": "gpt-4o", "input_tokens": 4294967295, "output_tokens": 4294967295 }

Without fix: integer overflow → panic (debug) or wrap (release)
With fix:    saturating_add → 4294967295 (no panic)

  ✓ Response: 200 OK
  ✓ total_tokens: u32::MAX (not wrapped to 0)
```

### Test: Constant-Time API Key Comparison

```
Original code:
  fn constant_time_eq(a, b) -> bool {
    if a.len() != b.len() { return false; }  // ← LENGTH LEAK
    ...
  }

Fixed code:
  fn constant_time_eq(a, b) -> bool {
    let mut diff = (a.len() ^ b.len()) as u8;
    for i in 0..max(a.len(), b.len()) {
      diff |= a.get(i).unwrap_or(0xFF) ^ b.get(i).unwrap_or(0x00);
    }
    diff == 0  // ← same time regardless of length
  }
```

### Test: 20 Concurrent Requests → Metrics Consistency

```
Spawn 20 tasks simultaneously
After all complete:
  ✓ metrics.total_requests == 20 (not 19, not 21)
  ✓ No atomic counter race
```

### Test: Rate Limiter Returns 429

```
Rate limit: 2 requests/minute

  Request 1 → 200 OK
  Request 2 → 200 OK
  Request 3 → 429 Too Many Requests + Retry-After header

  ✓ Not 500 (server error)
  ✓ Not silent drop
  ✓ Retry-After present
```

---

## The Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ 4  ╲  ← Loom (exhaustive interleaving)
                 ╱──────╲
                ╱   5    ╲  ← Proptest (random invariant checking)
               ╱──────────╲
              ╱    10      ╲  ← Fault injection (WAL corruption/crash)
             ╱──────────────╲
            ╱      28        ╲  ← Handler adversarial (malformed input)
           ╱──────────────────╲
          ╱       183          ╲  ← Unit + integration (correctness)
         ╱────────────────────────╲
```

| Layer | Count | What it proves |
|-------|-------|----------------|
| Loom exhaustive | 4 | No deadlock or race under ANY thread schedule |
| Proptest property | 5 | Budget invariants hold for ALL possible inputs |
| Fault injection | 10 | WAL survives disk corruption, partial writes, crashes |
| Handler adversarial | 28 | HTTP layer survives malformed, oversized, concurrent input |
| Unit + integration | 183 | Core logic is correct |
| **Total** | **230** | |

---

## What This Caught

These aren't theoretical exercises. The adversarial tests caught — or were written immediately after fixing — real bugs:

| Bug | Severity | How it was found |
|-----|----------|-----------------|
| WAL `send()` blocks forever if writer dies with full queue | **CRITICAL** | Thread pool starvation under load |
| Mutex poison in execution ledger deadlocks all Condvar waiters | **CRITICAL** | Single panic → permanent gateway freeze |
| `constant_time_eq` leaks API key length via timing | **HIGH** | Security review |
| NaN cost maps to 0 microcents → free LLM calls | **HIGH** | Proptest poison float values |
| u32 overflow in `total_tokens` → panic in debug | **MEDIUM** | Handler adversarial testing |
| CORS fully permissive in default Simulate mode | **HIGH** | Security review |

---

## The Honest Part

230 tests, 0 failures, 1 second. That sounds impressive.

But here's what I still don't have:

- **Zero production traffic.** These tests prove the engine is correct in isolation. They don't prove it handles real LLM workloads at scale.
- **No mutation testing.** I don't know if my tests actually catch bugs or just happen to pass alongside them.
- **`runtime.rs` is 3,678 lines.** The most complex file in the codebase. It has 18 tests, but it should probably be 5 modules.
- **Naming is still messy.** The package is `norn-gateway`, the engine is `calybris`, the subsystem is `velora`, the brand is `GOVERIS`. A new contributor would be confused.

Tests don't make software good. They make software *provably not broken in the ways you've imagined*. The bugs you haven't imagined are still out there.

But I'd rather have 230 proofs of what works than zero proofs and a hope.

---

*Calybris is the decision engine behind [GOVERIS](https://emirhuseyin.tech/calybris/), an AI cost governance gateway. If you're running LLM workloads and want to see where your spend goes, I'm offering private shadow replay pilots.*

*[emirhuseyininci@gmail.com](mailto:emirhuseyininci@gmail.com?subject=GOVERIS%20Shadow%20Replay%20Pilot) · [emirhuseyin.tech](https://emirhuseyin.tech) · [GitHub](https://github.com/emirhuseynrmx)*
