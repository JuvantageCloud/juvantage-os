# Positioning — Juvantage company architecture

**Locked:** Viktor is a tool *you* use to grow the business. It is **not** a Juvantage OS worker and does **not** belong inside the OS product diagram.

---

## What we market hardest (public)

| Audience | Hardest sell | Status |
|----------|--------------|--------|
| **General public** | **JUST™ suite** (Scan, KEEP, Line — Haven next) | **Live / shipping** — this is the “iPhone” |
| **Everyone (brand bet)** | **Juvantage OS** — unfinished work → finish it (Personal + Teams) | **Waitlist / private build** — flagship; see [JUVANTAGE_OS_SCOPE.md](./JUVANTAGE_OS_SCOPE.md) |
| **Local shops / B2B service** | Launch + Care (websites) | **Available** — *one slice* under For Business, not the company identity |

Websites are **not** the homepage hero. Over-selling Care Stack made us look like a web shop.

---

## Company hierarchy

```text
JUVANTAGE
├── JUST™                 → public consumer suite (what’s available today)
├── Juvantage OS          → unfinished-work daemon (Personal + Teams) — FLAGSHIP
│                            catch unfinished work → finish it (approve → execute → verify)
├── For Business (B2B)
│   └── Launch + Care     → website build/host (entry service only)
└── Parked                → old multi-biz “Command / Business OS” iOS shell — not marketed
```

**Focus rule:** One software flagship — **Juvantage OS**. Full scope, ARR, and GTM: [JUVANTAGE_OS_SCOPE.md](./JUVANTAGE_OS_SCOPE.md).  
**Parked:** multi-biz Instagram/TikTok command phone (ex-Business OS). Reuse patterns later; do not App Store or homepage it.

**Website voice (honest):**

> What’s public today is a fraction of the stack. JUST™ ships now. Juvantage OS is the layer we’re building toward.

- **JUST™** — apps people can use today  
- **Juvantage OS** — the proprietary OS-layer product (not a kernel; an agent you deploy)  
- **For Business** — B2B SaaS + ops; websites are underneath, not the billboard  

---

## Naming: “OS” without lying

We are **not** shipping a replacement for macOS/iOS.  
**Juvantage OS** means: a **personal/business command layer** (daemon/agent/container) that people install so day-to-day work runs through observe → propose → approve → execute — at consumer *and* business scale.

Until that product is defined enough to demo:

1. Market **JUST™** hardest on the public homepage.  
2. Put **OS** on a **waitlist** with the desktop preview as aspiration, not a fake ship date.  
3. Keep **Care Stack** on `/for-business` as a real offer, labeled as one service.

---

## The OS loop (prove this before breadth)

```text
OBSERVE → UNDERSTAND → PROPOSE → APPROVE → EXECUTE → VERIFY
```

V1 success is **useful intelligence from real data + at least one approve→action→verify path** — not “Claude is wired.”

---

## Viktor vs Workers (do not conflate)

| | **Viktor (external)** | **Workers (future, inside OS)** |
|--|----------------------|----------------------------------|
| Who uses it | You, the founder | The OS, after you approve |
| In OS product? | **No** | Yes — later |

**Product rule:** Never plan “Ask Viktor” as an OS feature.

---

## Care Stack vs OS (two businesses)

| | Care Stack | OS |
|--|------------|-----|
| Type | **Service** | **Software / platform** |
| Sell | Build / host / maintain client sites | Agent layer people (and later teams) deploy |
| Homepage weight | Low | High as waitlist; JUST is the live sell |

Do not blur them into one giant product.

---

## Product rules (do not drift)

1. Prove **signal → insight → decision → action → verification** before theater.  
2. Homepage sells **JUST™ live** + **OS waitlist** — not websites.  
3. Capture → Keep → Act → Grow stays the JUST™ story.  
4. **Viktor ≠ Workers.**

---

## Related

- **[JUVANTAGE_OS_SCOPE.md](./JUVANTAGE_OS_SCOPE.md)** — OS business (job, ICP, ARR, GTM)  
- **[OS_PRODUCT.md](./OS_PRODUCT.md)** — Desktop ship + UX + agent symbol  
- **[OS_ARCHITECTURE.md](./OS_ARCHITECTURE.md)** — Context, container, branches  
- [CURSOR_BRIDGE_V2.md](./CURSOR_BRIDGE_V2.md)  
- [ROADMAP_30_DAYS.md](./ROADMAP_30_DAYS.md) — revise toward OS Personal dogfood (Command parked)  
- Umbrella: `Desktop/JUVANTAGECLOUD/SUITE_STRATEGY.md`
