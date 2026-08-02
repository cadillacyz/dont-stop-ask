# Security and privacy

`dont-stop-ask` is currently a **local application**, not an internet-facing service. The helper can
start a local AI CLI with permission to write generated artifacts, so its browser-to-process boundary
is treated as privileged.

## Secure local defaults

- The server binds to `127.0.0.1` only.
- Static routes expose only `viewer/` and `question-sets/question-set*.json`; repository files are
  not web-readable.
- Every state-changing API call requires a random per-launch token obtained by the same-origin viewer.
- Host, Origin, JSON content type, body size, field types, and field lengths are checked.
- Generation has bounded concurrency, a configurable timeout, bounded logs, cancellation, and job
  expiry.
- Security headers deny framing, MIME sniffing, referrer leakage, cross-origin resource use, and
  unapproved script or connection origins.
- Question-set source links must use HTTP or HTTPS.

These controls reduce browser-based attacks against the local helper. They do not turn it into a
public server. **Do not expose the helper through port forwarding, a tunnel, a reverse proxy, or a
public network interface.**

## Private data

Questions and context may disclose a person's interests, school, employer, beliefs, health concerns,
or current work. Generated sets remain in the ignored `question-sets/` directory. Do not commit or
share them without reviewing their metadata and contents. Deleting a set from disk is the local data
deletion mechanism.

## Remaining trusted component

The configured Codex, Claude Code, Cursor, or GitHub Copilot command is a trusted local dependency.
The defaults allow edits because the skill must write into `question-sets/` — each provider is
invoked with its own full-autonomy flag (e.g. Cursor's `--force`, Copilot's `--allow-all`), matching
what Codex's `--full-auto` and Claude's `--permission-mode acceptEdits` already do. Run the
repository in a directory containing no unrelated sensitive files, review `DSA_CODEX_CMD`,
`DSA_CLAUDE_CMD`, `DSA_CURSOR_CMD`, `DSA_COPILOT_CMD`, or `DSA_AGENT_CMD` before overriding one, and
install each CLI only from its official distribution.

## Reporting

Report a vulnerability privately to the repository owner before opening a public issue when the
report would make exploitation easier.
