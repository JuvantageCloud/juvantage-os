# Juvantage Cloud — org + Terraform architecture

**Status:** Locked direction (2026-10-19).  
**Naming:** Keep **Juvantage OS** for now; rename later when the product name locks.

This is the shared cloud plan for **Line** and **Juvantage OS**. One org. One infrastructure repo. Multiple services on the same AWS pattern — not a second random cloud for OS.

---

## Amended lock (Line + OS)

1. GitHub org: **`juvantagecloud`**
2. Repo: **`infrastructure/`** — Terraform for **all** products
3. First deploy: **EC2 for `line-plaid-api`** (Line phone testing)
4. Same Terraform modules ready for: **`os-brain`** (Juvantage OS Brain API)
5. Shared: **us-east-1**, Secrets Manager, **dev/prod**, security-group patterns, **systemd** (Docker later if needed)
6. Product name: keep **Juvantage OS** for now

| Service | When | What |
|---------|------|------|
| `line-plaid-api` | **Now** | Line iPhone ↔ Plaid |
| `os-brain` | When Mac alone isn’t enough (site / phone / cross-app memory) | Same Brain API you run locally |

**Same account, same Terraform style.** Hosting options for Brain:

- **A)** Second small EC2, or  
- **B)** Second systemd unit on the first EC2 until load forces a split  

**Start with B** (one bill, less ops). Move to **A** when OS traffic or blast-radius matters.

### What does not change

- OS Desktop keeps dogfooding on **localhost** until connectors need always-on Brain  
- Don’t rename the product yet  
- Don’t build ASG / multi-AZ for either service yet  

**Bottom line:** Assume OS gets an always-on Brain on AWS. Don’t invent a separate “OS cloud.” Extend `infrastructure/` with `os-brain` next to Line.

---

## GitHub org layout

```text
juvantagecloud/                         (Organization)
├── infrastructure/                     ← Terraform ONLY (source of truth)
├── line/                               ← iOS app
├── line-plaid-api/                     ← Line API (Node)
├── juvantage-os/                       ← Flagship (desktop + Brain API)
└── .github/                            ← org rules, shared workflows (optional)
```

**Rules (day one):**

- PRs required to `main`
- No secrets in git
- Only `infrastructure/` creates AWS resources
- App repos hold application code; they consume secrets at deploy time

---

## Runtime architecture

```text
                    GitHub (PR → review → merge)
                              │
                              ▼
                    infrastructure/ (Terraform)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
         AWS us-east-1                    AWS us-east-1
              DEV                              PROD
              │                               │
              ├─ VPC / default VPC            ├─ same pattern
              ├─ Security groups              │
              ├─ Secrets Manager              │
              │    (Plaid, LLM, OAuth, …)     │
              └─ EC2 (Amazon Linux 2023)      │
                   │                          │
                   ├─ systemd: line-plaid-api │
                   └─ systemd: os-brain       │  (phase 3; same host first)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
         Line iOS                        Mac Solo agent
         → line-plaid-api                → os-brain
                                         (/health, /loops, /approve, …)
```

Clients:

| Client | Talks to |
|--------|----------|
| Line iOS | `line-plaid-api` |
| Mac Solo agent (OS) | `os-brain` |
| Future website / Haven | `os-brain` (when ready) |

---

## Terraform layout (`infrastructure/`)

```text
infrastructure/
├── README.md                 ← why this layout exists
├── envs/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars  ← non-secret; secrets via TF_VAR / CI
│   └── prod/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
├── modules/
│   ├── network/              ← VPC/SG (or default VPC + SG)
│   ├── compute_ec2/          ← instance, EIP, IAM role/instance profile
│   ├── secrets/              ← Secrets Manager stubs + IAM read
│   └── service_node/         ← systemd unit pattern for Node services
└── services/
    ├── line_plaid_api/       ← wires modules for Line API
    └── os_brain/             ← same modules, different env/name/port
```

**EC2 defaults (start):**

- AMI: **Amazon Linux 2023**
- Size: **t4g.micro** or **t3.small**
- Region: **us-east-1**
- Process: **systemd** running Node
- HTTPS: add when DNS is ready (ALB or Caddy/nginx on box)

---

## What ships when

| Phase | Ship |
|-------|------|
| **1** | GitHub org + repos + PR rules |
| **2** | Terraform: 1× EC2, SG, EIP, secrets, deploy **`line-plaid-api`** (phone testing) |
| **3** | Deploy **`os-brain`** on same host (or second EC2) |
| **4** | CI on merge, HTTPS, tighter IAM; ASG later if needed |

---

## Related docs

- Line product decisions: `~/Desktop/Projects/LINE_DOCUMENTS/PRODUCT_EXECUTIVE_DECISIONS.md`
- Line phone-test note (Fly was alternative; **EC2 locked**): `Line/line-plaid-api/DEPLOY_PHONE_TESTING.md`
- OS local roadmap: `docs/OS_BUILD_ROADMAP.md`
