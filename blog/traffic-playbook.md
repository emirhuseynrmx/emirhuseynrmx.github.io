# Reklamsız Trafik Playbook — emirhuseyin.tech

## Bugün At (Hepsi hazır)

### 1. Show HN
```
Title: Show HN: I built a proof-carrying decision engine for LLM cost governance
URL: https://emirhuseyin.tech/calybris/

Text:
Every AI model call is a financial decision nobody reviews. I built Calybris — 
a Rust decision engine that evaluates cost, risk, quality, and confidence before 
each call reaches the provider. Every decision gets a SHA-256 fingerprint and 
a hash-chained audit trail.

The engine powers GOVERIS, a shadow replay gateway that observes LLM metadata 
without capturing prompts, then produces what-if policy scenarios.

Benchmarks (local, not cloud SLO): 8.6M decisions/sec kernel, 235 tests 
including fault injection, proptest, and loom exhaustive concurrency.

Looking for 3 design partners to run free 7-day shadow replay pilots.

Technical deep dive: https://emirhuseyin.tech/calybris/
Product page: https://emirhuseyin.tech/goveris/
```

**Zamanlama:** Pazartesi-Perşembe, 9:00-10:00 AM EST (HN prime time)

### 2. LinkedIn Post (Türkçe — hazır)
Zaten yazdığın post'u at. Görselleri ekle.

### 3. LinkedIn Post (İngilizce)
```
Every AI model call costs money. Most teams find out how much after the invoice.

I built Calybris — a decision engine that evaluates every LLM call before it 
reaches the provider. Cost, risk, quality, confidence — scored in 100 nanoseconds.

It doesn't just route. It proves why.

Every decision gets a cryptographic fingerprint. Every downgrade explains how much 
it saves. Every block explains what risk it prevented.

Looking for 3 design partners to run free shadow replay pilots.

→ emirhuseyin.tech/goveris

#LLM #AI #CostGovernance #Rust #SoftwareEngineering
```

### 4. Reddit Posts
**r/rust** (teknik):
```
Title: [Show] Calybris: allocation-free integer kernel for prescriptive decisions (8.6M/s, Rust)
```

**r/devops** / **r/sre**:
```
Title: Built a shadow replay gateway for LLM cost governance — metadata-only, no prompt capture
```

**r/artificial** / **r/MachineLearning**:
```
Title: We're spending $4,200/mo on AI and nobody can explain why each call was worth it. I built a fix.
```

**r/startups**:
```
Title: Solo founder, built an LLM cost governance engine in Rust. Looking for first 3 design partners.
```

### 5. Medium Yazıları (Hazır)
- "I Built a Decision Engine That Proves Why It Said No" (İngilizce)
- Türkçe versiyonu
- GOVERIS ürün yazısı

Her yazıyı farklı gün yayımla — haftada 2, toplam 3 hafta.

### 6. Dev.to Cross-Post
Medium yazılarını dev.to'ya da at — dev.to SEO'su Medium'dan güçlü.

### 7. Twitter/X Thread
```
Thread: Why your LLM bill is made of thousands of unreviewed decisions 🧵

1/ Your team spent $4,200 on AI last month. 
   Can you explain why each call was worth it?

2/ Most teams can't. Because there's no audit trail.
   A request comes in, a model gets selected, nobody knows why.

3/ I built @calybris — a decision engine that evaluates every call 
   before it reaches the provider.
   
4/ For every decision:
   ✓ Cost estimate
   ✓ Risk penalty
   ✓ Quality floor
   ✓ Cryptographic fingerprint

5/ The kernel runs at 8.6M decisions/sec. 
   No floating-point. No heap allocation. Pure integer arithmetic.

6/ But speed isn't the point. Proof is.
   Every decision is hash-chained. Tamper with one → the chain breaks.

7/ GOVERIS deploys in your VPC as a Docker container.
   Shadow mode first — observe without enforcing.
   No prompt capture. Metadata only.

8/ Looking for 3 design partners.
   Free 7-day pilot. You get the audit, I get your feedback.

   → emirhuseyin.tech/goveris
```

## Bu Hafta (İçerik SEO)

### 8. GitHub README Güncelle
`emirhuseynrmx/norn` repo'sunun README'sine:
- "Powered by Calybris Engine" badge
- emirhuseyin.tech/goveris linki
- Benchmark rakamları
- Design partner CTA

### 9. GitHub Profile README
`emirhuseynrmx/emirhuseynrmx` repo'sunda profile README:
- Calybris ecosystem özeti
- Proje linkleri
- "Currently looking for design partners" notu

### 10. Kaggle Notebook Descriptions
Her notebook'un description'ına:
- "Part of the Calybris ecosystem" notu
- emirhuseyin.tech linki

## Haftalık Rutin (Sürdürülebilir)

### 11. LinkedIn'de Haftalık Post
Her hafta farklı açıdan:
- Hafta 1: Benchmark görseli + "8.6M decisions/sec on a laptop"
- Hafta 2: WAL fault injection görseli + "We test what others don't"
- Hafta 3: Case study + "$1,420/mo saved on support team"
- Hafta 4: Loom concurrency görseli + "Every thread schedule explored"

### 12. HN/Reddit Comment Farming
"LLM cost", "AI spend", "model routing" konularında yorum yap:
- Kendi ürününü spam'leme
- Değerli teknik yorum yap
- Profilde link var, meraklılar tıklar

### 13. Topluluk Katılımı
- Rust Discord: #showcase kanalı
- AI/ML Discord sunucuları
- IndieHackers: ürün paylaşımı
- ProductHunt: launch planla (1 ay hazırlık)

## Hedefli Outreach (En Yüksek ROI)

### 14. Soğuk Email Template
```
Subject: Quick question about your LLM spend

Hi [Name],

I noticed [company] is using [OpenAI/Anthropic] for [use case - from their blog/docs].

I built a shadow replay tool that observes LLM call metadata (no prompts) 
and shows where premium models are used for tasks a cheaper model would handle.

Typical finding: 40-60% of calls can be downgraded without quality loss.

Would you be open to a free 7-day pilot? I deploy a Docker container, 
you point your traffic at it, I send you a report.

No commitment. Kill the container anytime.

— Emir
emirhuseyin.tech/goveris
```

### 15. LinkedIn DM Template
```
Hi [Name],

I'm building an LLM cost governance tool and looking for 3 design partners.

Free 7-day shadow replay — I deploy in your VPC, observe metadata only, 
produce an audit report showing where spend can be optimized.

Would [Company] be interested? Happy to share a sample report first.
```

## Zamanlama

| Gün | Aksiyon |
|-----|---------|
| Bugün | Show HN + LinkedIn TR post |
| Yarın | LinkedIn EN post + r/rust |
| Gün 3 | Medium #1 yayımla + dev.to cross-post |
| Gün 4 | Twitter/X thread + r/devops |
| Gün 5 | Medium #2 + r/artificial |
| Gün 6-7 | 10 soğuk email gönder |
| Hafta 2 | Medium #3 + ProductHunt hazırlık |
| Hafta 3 | 20 soğuk email + LinkedIn haftalık |
