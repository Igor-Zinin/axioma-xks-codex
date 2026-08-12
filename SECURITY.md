# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `v1.x`  | ✅ Active  |

---

## Reporting a Vulnerability

**Please do NOT open a public GitHub Issue for security vulnerabilities.**

If you discover a security issue in Game Codex, report it privately:

1. **GitHub Private Advisory** (preferred): Go to [Security → Advisories → New draft](https://github.com/Igor-Zinin/axioma-xks-codex/security/advisories/new) and submit a private draft.
2. **Email**: Contact the maintainer directly via GitHub profile.

We aim to respond within **72 hours** and will coordinate a fix before any public disclosure.

---

## Scope

This repository contains:
- **Code** (MIT): `selftest.mjs`, `packages/`, `scripts/`, `docs/` — report logic bugs, injection risks, or path traversal issues.
- **Knowledge Objects** (CC BY 4.0): `knowledge/pko/*.pko.json` — report factual errors in `evidence.ref`, broken `acceptance_sql`, or fabricated citations.

---

## What We Consider a Vulnerability

- Broken or fabricated `evidence.ref` links passing `C-06` selftest
- `acceptance_sql` assertions that produce false-positive verification
- Any `docs/` page serving user-controlled data without sanitization
- Secrets or private infrastructure paths committed to the public tree

---

## Acknowledgements

Verified reporters will be credited in the relevant release notes.
