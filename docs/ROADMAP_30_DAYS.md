# OS — next 30 days (revised)

> **SUPERSEDED (2026-10-16):** This roadmap targets the **parked iOS Command / multi-business** dogfood loop (“How’s it going?”, phone-first).  
> **Current V1 path:** Mac desktop unfinished-work agent — see [OS_PRODUCT.md](./OS_PRODUCT.md) and [README.md](./README.md).  
> Keep for archive only.

Aligned with [POSITIONING.md](./POSITIONING.md). Viktor stays **outside** the product.

## Week 1 — Make OS real (dogfood)

- Seed portfolio: JUST™ / Web Care / Fashion (not Northside demo forever)
- Dashboard answers useful questions from that data
- No new integration theater; LLM optional behind tools

**Done when:** open phone → see *your* businesses → ask “How’s it going?” → useful answer grounded in data.

## Week 2 — Make actions real

Lifecycle for 2–3 actions only:

```text
Alert → Investigate → Recommend → Approve → Execute (even stub) → Verify
```

Deep links from chat/alerts must navigate. Confirm sheet required.

## Week 3 — Worker *interface* (not Viktor)

- Define job schema: propose / approve / run / result / verify  
- Cursor Bridge remains stub but speaks that schema  
- **Do not** wire Viktor into OS  

## Week 4 — Harden only what the loop needs

- Auth polish (not demo-password-as-product)
- Audit trail for approvals
- Hosted API when you leave Mac-LAN
- Postgres when deploying multi-tenant — not before

## Explicitly deferred

- Google Calendar / Instagram unless they prove the OS loop  
- “Ask Viktor” button  
- Enterprise SSO / K8s / compliance theater  
- Desktop + Bedrock  

## Success bar to call it an OS

Open phone → real Juvantage state → intelligent answer → investigate → approve → worker/stub executes → verification visible.
