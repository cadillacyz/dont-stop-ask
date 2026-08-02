# Production boundary

The checked-in implementation is a secure-by-default **single-user local companion**. It is ready for
local beta use after the verification commands below pass. It is deliberately not a hosted multi-user
application.

## What the local release guarantees

- A user can launch the viewer, generate directly through an installed Codex, Claude Code, Cursor, or
  GitHub Copilot CLI, and reopen generated sets from local history.
- Jobs can be cancelled and are bounded by concurrency and time limits.
- Invalid or unsafe question sets are rejected instead of partially rendered.
- The graph is keyboard operable, and the landing flow has a responsive small-screen layout.
- Generated research data remains local unless the configured model CLI sends it to its provider.

## Hosted architecture boundary

A public website must replace the local process API; `scripts/serve.py` must never be deployed as its
backend. The minimum hosted design is:

1. A static web client with no provider secrets.
2. An authenticated API that owns sessions, authorization, quotas, deletion, and export.
3. A durable queue with isolated workers, cancellation, retries, idempotency, and per-job timeouts.
4. Encrypted per-user artifact storage with retention controls and audit events.
5. A server-side model/search integration with provider keys in a secret manager.
6. Structured logs, health checks, latency/error/cost metrics, alerting, backups, and a rollback path.

## Public-launch gates

Before a hosted beta, make and document these product decisions:

- Authentication model and whether anonymous trials are allowed.
- Per-user budgets, abuse controls, and provider cost ceilings.
- Data retention, deletion, export, sharing, and incident-response policy.
- A sensitive-topic policy, especially for medical, legal, crisis, self-harm, and guided use with
  minors. The current skill does not provide this policy.
- Human review and reporting flows for incorrect, stale, retracted, or harmful sources.
- Accessibility testing against WCAG 2.2 AA with keyboard and screen-reader users.

## Verification

Run from the repository root:

```bash
python -m unittest discover -s tests -v
python scripts/validate.py
node --check viewer/graph.js
```

Then run `python scripts/serve.py`, test one no-CLI handoff or real generation, open a source, operate a
graph node with Enter and Space, cancel a generation, and inspect the layout at desktop and phone
widths.
