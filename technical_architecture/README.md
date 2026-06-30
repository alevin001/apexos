# Technical Architecture

## Responsibility

This folder contains the **Technical Architecture** — the minimum viable technical implementation required to begin building ApexOS while preserving doctrine, governance, explainability, learning, executive agency, and outcome validation.

Conceptual architecture (in `architecture/`) defines **what** ApexOS is. Technical architecture defines **how** to implement it faithfully.

## Documents

| Document | File | ID |
|----------|------|----|
| Technical Architecture v0.1 (Founder Draft) | `ApexOS - Technical Architecture v0.1_Founder_Draft.docx` | TECH-001 |
| Runtime Integration Architecture | `runtime-integration-architecture.md` | TECH-002 |

### Runtime Integration Architecture (TECH-002)

Build 11B clarifies how ChatGPT and the ApexOS Runtime Engine cooperate during implementation:

- ChatGPT as executive conversation interface
- Runtime Engine as executive intelligence engine
- Executive Context Package assembly before LLM invocation
- Supabase and Knowledge Repository roles
- Future MCP integration and runtime portability
- Commercialization implications

This is an **implementation clarification**. It does not modify conceptual architecture (DOC-001 through DOC-009).

## Technical Architecture Principles

1. **Doctrine Remains The Source Of Truth** — Technology serves doctrine; technology may not redefine doctrine
2. **Simplicity Over Complexity** — Prefer the simplest implementation that faithfully preserves architecture
3. **Founder Buildability** — Buildable and maintainable through AI-assisted development
4. **Portability** — No decision should permanently lock ApexOS into a specific platform
5. **Learning Through Usage** — Real-world usage shapes future implementation decisions

### Runtime Integration Principles (TECH-002)

6. **Conversation is not intelligence** — ChatGPT provides conversation; ApexOS provides executive intelligence
7. **Context precedes reasoning** — Runtime Engine prepares executive context before LLM reasoning
8. **Reasoning is orchestrated, not duplicated** — ApexOS orchestrates; it does not replace foundation model reasoning
9. **Doctrine governs orchestration** — All Runtime behavior remains governed by doctrine and architecture
10. **Portability is preserved** — Runtime Engine remains independent of any single foundation model or interface

## Canonical Objects (Technical)

Executive, Person, Relationship, Situation, Decision, Outcome, Pattern, Knowledge

## Canonical Flow

```
Situation → Context → Retrieval → Evidence Assembly → Interpretation → Recommendation → Decision → Action → Outcome → Pattern Update → Future Executive Behavior
```

## Runtime Integration Flow

```
Executive → ChatGPT → ApexOS Runtime Engine → Supabase / Knowledge Repository
                              ↓
                    Executive Context Package
                              ↓
                         LLM Reasoning
```

See `runtime-integration-architecture.md` for full responsibility model, layered architecture diagram, and implementation principles.

## MVP System Boundary

**ApexOS Owns:** Executive memory, people intelligence, relationship intelligence, situational history, decisions, outcomes, patterns, knowledge repository

**ApexOS References:** CRM, ERP, project management, email, calendars, external documents

**ApexOS Is Not:** ERP, CRM, project management software, workflow management software

**ChatGPT Owns:** Natural language conversation, understanding, synthesis, explanation, communication

**ChatGPT Is Not:** ApexOS — it is the executive conversation interface, not the intelligence engine

## Implementation Note

Build 07 (Supabase Implementation) applies persistence architecture. Build 11B (Runtime Integration Architecture) clarifies interface-to-runtime boundaries for ChatGPT integration. Builds 01 through Build 06 establish repository structure and design artifacts only — no database schemas, SQL, or application code until Build 07.

## Status

Conceptual Architecture Phase: **Complete**

Runtime Integration Architecture (TECH-002): **Complete** (Build 11B)

Next Phase: MCP integration and ChatGPT runtime binding (Build 11C+)
