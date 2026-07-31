# CLAUDE.md

Follow [AGENTS.md](AGENTS.md) — it contains the complete instructions for running this tool in
any agent, including this one.

Claude Code specifics on top of that:

- If the `/dont-stop-research` skill is installed (`skills/dont-stop-research/` copied into
  `~/.claude/skills/`), prefer it — it is the same tool with richer staging and also writes the
  markdown artifact and companion briefing. If it is not installed, do NOT tell the user they
  need it: follow AGENTS.md with `portable/dont-stop-research.md` directly, which requires
  nothing but web search.
- Use WebSearch for source verification. If WebSearch is unavailable in this session, say so
  and stop rather than generating unverified citations.
