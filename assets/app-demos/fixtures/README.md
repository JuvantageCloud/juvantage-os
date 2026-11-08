# App demo fixtures (fake data)

Synthetic documents for Just Scan + KEEP (Just Vault) simulator tests and marketing captures.

**Not real PII.** Names, addresses, policy numbers, and medical content are invented.

## Layout
- `documents/` — lease, insurance, title
- `ids/` — passport / license / student ID style images
- `health/` — vax record, labs, insurance card
- `receipts/` — parking, coffee, pharmacy
- `photos/` — colored photo stand-ins
- `notes/` — wifi, emergency contacts, warranties
- `misc/` — W-2 style, utility bill, handwritten note (good Scan targets)

## Use
- KEEP `DemoVaultSeeder` can mirror these names/types
- Copy into Simulator Files app or Photos for manual import tests
- Safe to commit; contains no secrets
