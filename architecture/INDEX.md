# Architecture & Doctrine Index

Traceable markdown index to authoritative architecture documents. **Do not duplicate architecture content here.**

## Authority

| Document | Location |
|----------|----------|
| Architecture & Doctrine Index v2.0 (authoritative) | `99 - ApexOS - Minimum Viable Index v2.0.docx` |
| Architecture Document Registry | `README.md` |

This markdown index provides implementation traceability. The `.docx` index remains the authoritative registry.

---

## Conceptual Architecture (DOC-001 through DOC-009)

| ID | Document | File | Status |
|----|----------|------|--------|
| DOC-001 | Project Charter v1.0 | `1 - ApexOS - Project Charter v1.0.docx` | Authoritative |
| DOC-002 | Foundations Architecture v1.0 | `2 - ApexOS - Foundations Architecture v1.0.docx` | Authoritative |
| DOC-003 | Memory Architecture v1.0 | `3 - ApexOS - Memory Architecture v1.0.docx` | Authoritative |
| DOC-004 | Context Architecture v1.0 | `4 - ApexOS - Context Architecture v1.0.docx` | Authoritative |
| DOC-005 | Retrieval Architecture v1.0 | `5 - ApexOS - Retrieval Architecture v1.0.docx` | Authoritative |
| DOC-006 | Governance Architecture v1.0 | `6 - ApexOS - Governance Architecture v1.0.docx` | Authoritative |
| DOC-007 | Inference Architecture v1.0 | `7 - ApexOS - Inference Architecture v1.0.docx` | Authoritative |
| DOC-008 | Recommendation Architecture v1.0 | `8 - ApexOS - Recommendation Architecture v1.0.docx` | Authoritative |
| DOC-009 | Outcome & Results Architecture v1.0 | `9 - ApexOS - Outcome & Results Architect v1.0.docx` | Authoritative |

Conceptual architecture documents are unchanged by Build 11B. They define **what** ApexOS is.

---

## Technical Architecture (Implementation Guidance)

| ID | Document | File | Status |
|----|----------|------|--------|
| TECH-001 | Technical Architecture v0.1 (Founder Draft) | `../technical_architecture/ApexOS - Technical Architecture v0.1_Founder_Draft.docx` | Authoritative |
| TECH-002 | Runtime Integration Architecture | `../technical_architecture/runtime-integration-architecture.md` | Authoritative — Build 11B |

Technical architecture documents define **how** to implement conceptual architecture faithfully. TECH-002 clarifies runtime integration boundaries without modifying DOC-001 through DOC-009.

### TECH-002 — Runtime Integration Architecture (Build 11B)

| Topic | Location in TECH-002 |
|-------|---------------------|
| ChatGPT responsibilities | Section 3 |
| Runtime Engine responsibilities | Section 4 |
| Supabase responsibilities | Section 5 |
| Knowledge Repository responsibilities | Section 6 |
| Executive Context Package | Section 7 |
| LLM responsibilities | Section 8 |
| Future MCP integration | Section 9 |
| Runtime portability | Section 10 |
| Commercialization implications | Section 11 |
| Implementation principles | Section 12 |

---

## Product Experience (Subordinate to Architecture)

| ID | Document | File | Status |
|----|----------|------|--------|
| PROD-001 | Executive Experience Design v1.1 | `../docs/product/Executive Experience Design v1.0.md` | Authoritative |

Product experience governs how the executive experiences ApexOS. Runtime integration (TECH-002) governs how ChatGPT and the Runtime Engine cooperate technically.

---

## Architecture Map

```
Layer 1 — Doctrine (Charter, DOC-001)
Layer 2 — Core Architecture (DOC-002 through DOC-009)
         Index (cross-reference and registry)
Technical Architecture (TECH-001, TECH-002 — implementation guidance)
Product Experience (PROD-001 — experience specification)
```

---

## Implementation Traceability (Build 11B)

Build 11B adds implementation traceability without architectural amendment:

| Clarification | Document | Architectural Impact |
|---------------|----------|---------------------|
| ChatGPT as executive interface | TECH-002 | None — interface layer only |
| Runtime Engine as intelligence engine | TECH-002 | None — orchestration clarification |
| Executive Context Package | TECH-002 | None — runtime integration boundary |
| MCP integration (future) | TECH-002 | None — future interface mechanism |
| Runtime portability | TECH-002 | None — reinforces TECH-001 principle |

**Rule:** Implementation may support architecture. Implementation may not redefine architecture (LAD-002).

---

## Diagrams

| Diagram | File |
|---------|------|
| Overview | `Image - 0 - Overview.png` |
| Executive Learning Loop | `Image - 1 - Executive Learning Loop.png` |
| Executive Operating Loop | `Image - 2 - Executive Operating Loop.png` |
| Learning & Reinforcement Loop | `Image - 3 - Learning & Reinforcement Loop.png` |
| Reasoning Pipeline | `Image - 4 - Reasoning Pipeline.png` |
| Evidence to Truth Model | `Image - 5 - Evidence to Truth Model.png` |

Runtime Integration layered architecture diagram: `../technical_architecture/runtime-integration-architecture.md` Section 2.

---

## Amendment Rule

New architecture documents require governance review per Index Section 10. TECH-002 is a technical implementation clarification — not an architectural amendment. It does not modify DOC-001 through DOC-009.

See `STORAGE-GUIDE.md` and `../governance/amendment-controls/README.md`.
