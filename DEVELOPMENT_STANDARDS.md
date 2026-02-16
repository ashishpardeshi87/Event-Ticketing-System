# Development Standards

This document defines how we fix bugs and add features in this project. Follow it for all changes.

---

## 1. Fix from the root

- **Do not fix superficially.** Address the **root cause** of the issue, not only the symptom.
- Before changing code:
  - Reproduce and confirm the bug.
  - Identify **why** it happens (wrong assumption, missing validation, bad data flow, wrong layer, etc.).
  - Fix at the right layer (e.g. fix validation at the API boundary instead of patching every caller).
- Prefer **one clear fix** over multiple scattered workarounds.
- After the fix:
  - Check related code paths and edge cases.
  - Ensure error handling, logging, and (if any) tests stay consistent.

---

## 2. Add features properly

- **Implement features fully and correctly.** No half-done or “quick” implementations that leave gaps.
- Before coding:
  - Clarify scope and acceptance criteria.
  - Think through data model, API contract, permissions, and UX (loading, errors, empty states).
- During implementation:
  - Implement **end-to-end**: backend + frontend + validation + error handling + loading/empty states.
  - Do **not** leave critical paths with TODOs, placeholders, or “we’ll fix later” logic.
- Match **existing project patterns**: structure, naming, error handling, logging, and style.

---

## 3. Security

Security is a core requirement. Every fix and feature must consider it.

- **Principle of least privilege**  
  Grant only the minimum access needed: strict Firestore rules, correct API auth, and role checks. Avoid permissive rules or "allow all" even temporarily.

- **Validate and enforce on the backend**  
  Never trust the client. Authentication, authorization, input validation, and business rules must be enforced server-side. Frontend checks are for UX only.

- **No secrets or sensitive logic in the client**  
  Keep secrets (API secrets, service account keys, etc.) in backend environment only. Frontend may use public config (e.g. Firebase client config); do not expose or bypass auth/roles from the client.

- **Secure by default**  
  New API endpoints are protected by auth where appropriate. New Firestore collections have explicit security rules. Fix security issues at the root (e.g. rule or API contract), not with one-off checks.

- **Data and identity**  
  Users must only access their own data unless the feature explicitly allows shared access (e.g. team members). Validate resource ownership (or membership) on the server before returning or modifying data.

---

## 4. Quality bar

- Code must be **correct**, **readable**, and **maintainable**.
- Avoid one-off hacks that become permanent. Prefer clear, reusable solutions.
- Prefer small, focused changes. For larger work, break it into ordered steps.
- When unsure, **implement or fix it properly the first time** instead of adding technical debt.

---

## 5. Summary

| Do | Don’t |
|----|--------|
| Fix root cause | Patch only symptoms |
| Design then implement | Code first, fix later |
| Complete features end-to-end | Leave half-implemented features |
| Align with existing patterns | Introduce one-off styles or hacks |
| Keep changes clear and maintainable | Add “quick” fixes that increase debt |
| Enforce auth and validation on the backend | Rely on frontend for security |
| Least privilege (rules, roles, APIs) | Permissive or "allow all" access |
| Treat security as core to every change | Add security as an afterthought |

These standards apply to all contributions to this repository.
