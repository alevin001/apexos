# Runtime Integration Architecture

**Document ID:** TECH-002  
**Status:** Authoritative — Technical Implementation Clarification  
**Date:** 2026-06-30  
**Build:** 11B — Runtime Integration Architecture  
**Context:** Post–Build 11A product realization; clarifies how ChatGPT and the ApexOS Runtime Engine cooperate during implementation

---

## Document Authority

| Relationship | Documents |
|--------------|-----------|
| **Subordinate to** | Project Charter v1.0 (DOC-001), Doctrine, Conceptual Architecture (DOC-002 through DOC-009) |
| **Superior to** | Runtime implementation, interface adapters, integration code, and deployment configuration |
| **Does not modify** | Charter, Foundations, Memory, Context, Retrieval, Governance, Inference, Recommendation, or Outcome/Results Architecture |

This document clarifies **how** existing architecture is orchestrated at runtime. It does not redefine **what** ApexOS is.

---

## 1. Purpose

ApexOS has reached an important architectural realization:

**The primary executive experience will be ChatGPT.**

However:

- **ChatGPT is not ApexOS.** ChatGPT is the executive conversation interface.
- **ApexOS remains the executive intelligence engine.** The Runtime Engine owns memory, context, retrieval, evidence assembly, governance, reasoning orchestration, recommendation orchestration, Executive Glass Box, outcome validation, learning, and executive continuity.

The Runtime Engine assembles an **Executive Context Package** and provides it to the underlying LLM. The LLM performs its native reasoning using that context. ApexOS does not attempt to replace or duplicate the general reasoning capabilities of modern foundation models. Instead, ApexOS augments those models with executive-specific intelligence.

---

## 2. Layered Architecture

```
Executive
    ↓
ChatGPT                          ← Executive conversation interface
    ↓
ApexOS Runtime Engine            ← Executive intelligence orchestration
    ↓
    ├── Memory
    ├── Context
    ├── Retrieval
    ├── Evidence Assembly
    ├── Inference Orchestration
    ├── Recommendation Orchestration
    ├── Governance
    ├── Learning
    └── Executive Glass Box
    ↓
Supabase                         ← Persistent runtime store
    ↓
Knowledge Repository             ← Authoritative knowledge inventory
```

### Layer Responsibilities

| Layer | Responsibility | Does Not Own |
|-------|----------------|--------------|
| **Executive** | Decisions, judgment, agency | Runtime orchestration, evidence assembly, learning mechanics |
| **ChatGPT** | Natural language conversation, understanding, synthesis, explanation, communication | Executive memory, governance, evidence assembly, outcome validation, learning |
| **ApexOS Runtime Engine** | Executive intelligence orchestration — memory, context, retrieval, evidence, governance, reasoning orchestration, recommendation orchestration, Glass Box, outcomes, learning | General-purpose LLM reasoning; conversational UX |
| **Supabase** | Persistent storage, auth, RLS, artifact registry, pipeline tables, transformation log | Reasoning, governance enforcement, evidence selection |
| **Knowledge Repository** | Doctrine references, frameworks, concepts, source material, reference content | Runtime orchestration, executive memory, live pipeline execution |

---

## 3. ChatGPT Responsibilities

ChatGPT serves as the **executive conversation interface**. It is the surface through which the executive experiences ApexOS.

| Capability | Description |
|------------|-------------|
| Natural language understanding | Interpreting what the executive means in conversational input |
| Conversation | Maintaining fluid dialogue, tone, pacing, and continuity |
| Synthesis | Integrating Runtime-supplied context into coherent responses |
| Explanation | Communicating reasoning, recommendations, and guidance to the executive |
| Writing | Producing executive-facing language — summaries, briefings, drafts |
| Reasoning over supplied context | Applying native LLM reasoning to the Executive Context Package |
| Communication | Clarifying questions, follow-ups, and conversational handoffs |

ChatGPT does **not** own executive memory, organizational context assembly, evidence retrieval, doctrine enforcement, outcome validation, or learning. Those remain Runtime Engine responsibilities.

---

## 4. Runtime Engine Responsibilities

The Runtime Engine is the **executive intelligence engine**. It orchestrates the canonical pipeline defined in conceptual architecture:

```
Situation → Context → Retrieval → Evidence Assembly → Inference → Recommendation → Decision → Action → Outcome → Pattern Update → Future Executive Behavior
```

### What the Runtime Engine Owns

| Capability | Architectural Source | Runtime Role |
|------------|---------------------|--------------|
| Executive memory | Memory Architecture (DOC-003) | Persist and retrieve executive, person, relationship, situation, decision, and pattern memory |
| Contextual intelligence | Context Architecture (DOC-004) | Determine relevance, domain weights, and context evaluation |
| Retrieval | Retrieval Architecture (DOC-005) | Execute retrieval requests and rank evidence |
| Evidence assembly | Retrieval Architecture (DOC-005) | Assemble evidence packages and context packages |
| Governance | Governance Architecture (DOC-006) | Enforce doctrine, fidelity, and governance constraints |
| Reasoning orchestration | Inference Architecture (DOC-007) | Orchestrate interpretation — not replace LLM reasoning |
| Recommendation orchestration | Recommendation Architecture (DOC-008) | Orchestrate decision support — recommendations inform, not decide |
| Executive Glass Box | Governance + traceability | Provide decision provenance and explainability |
| Outcome validation | Outcome/Results Architecture (DOC-009) | Capture, validate, and track outcomes |
| Learning | Outcome/Results Architecture (DOC-009) | Update patterns, promote memory, reinforce validated behavior |
| Executive continuity | Foundations Architecture (DOC-002) | Maintain continuity across conversations, situations, and decisions |

### What the Runtime Engine Does

The Runtime Engine:

1. **Orchestrates the reasoning pipeline** — executes Context through Learning per canonical flow
2. **Enforces doctrine** — applies governing principles before and during orchestration
3. **Enforces governance** — fidelity, traceability, and drift protection throughout
4. **Assembles evidence** — builds evidence packages and context packages from memory and knowledge
5. **Validates outputs** — ensures pipeline artifacts meet governance and quality criteria
6. **Captures outcomes** — records executive decisions and observed results
7. **Updates learning** — promotes validated patterns and reinforces executive behavior

### What the Runtime Engine Does Not Do

The Runtime Engine does **not** attempt to become a general-purpose LLM. It does not:

- Replace foundation model natural language understanding
- Duplicate conversational AI capabilities
- Perform unconstrained generative reasoning without assembled executive context
- Substitute for the executive's judgment or agency

ApexOS orchestrates reasoning. It does not duplicate modern LLM reasoning.

---

## 5. Supabase Responsibilities

Supabase is the **persistent runtime store** for Build 08+ implementation.

| Capability | Description |
|------------|-------------|
| Artifact persistence | Pipeline tables mirror repository templates and frontmatter |
| Auth and RLS | Executive-scoped access to runtime data |
| Traceability | `artifact_registry`, `artifact_links`, `transformation_log` |
| Storage | Knowledge source files, attachments, and binary content |
| Portability | Standard Postgres — no permanent platform lock-in |

Supabase stores what the Runtime Engine produces. It does not orchestrate reasoning, enforce doctrine, or assemble evidence. See `supabase/IMPLEMENTATION-GUIDE.md`.

---

## 6. Knowledge Repository Responsibilities

The Knowledge Repository (`knowledge/`) is the **expandable intelligence inventory** governed by Charter Section 13 and Technical Architecture v0.1.

| Capability | Description |
|------------|-------------|
| Doctrine references | Traceable indices to Charter — no duplicated doctrine text |
| Frameworks | Leadership, communication, negotiation, and behavioral frameworks |
| Concepts | Derived concept artifacts supporting interpretation |
| Source material | Primary documents — books, PDFs, articles, transcripts |
| Reference | Derived reference materials for executive guidance |

The Knowledge Repository supplies content that Retrieval assembles into evidence. It does not execute the pipeline or serve as the executive interface. See `knowledge/REPOSITORY-GUIDE.md`.

---

## 7. Executive Context Package

Before invoking the LLM, the Runtime Engine assembles an **Executive Context Package** — the structured executive intelligence payload that enables the LLM to reason with executive-specific context rather than generic knowledge alone.

### Package Contents

The Runtime Engine assembles the following before LLM invocation:

| Component | Source | Purpose |
|-----------|--------|---------|
| Relevant executive memory | `memory/` — executive, situation, decision, pattern | Prior context and history for this executive |
| Person context | `memory/person/`, `foundations/` | Individuals relevant to the current situation |
| Relationship context | `memory/relationship/` | Relationship dynamics and history |
| Organizational context | Context Architecture domains | Organizational relevance and framing |
| Strategic context | Context Architecture domains, knowledge/doctrine | Strategic considerations and alignment |
| Retrieved evidence | `retrieval/evidence/`, `knowledge/` | Assembled evidence from memory and knowledge |
| Contradictory evidence | `retrieval/` — contradictory evidence records | Conflicting or alternative evidence |
| Historical outcomes | `memory/outcome-results/`, `outcomes/` | Prior decisions and their observed results |
| Validated patterns | `memory/pattern/` | Patterns reinforced through outcome validation |
| Applicable doctrine | `knowledge/doctrine/`, Charter references | Governing principles for this situation |
| Governance constraints | Governance Architecture | Fidelity, traceability, and drift protection rules |
| Confidence indicators | Inference and retrieval artifacts | Uncertainty, assumptions, and confidence levels |

### Assembly Sequence

```
Executive input (via ChatGPT)
    ↓
Situation identification / creation
    ↓
Context evaluation (relevance specification)
    ↓
Retrieval (evidence gathering)
    ↓
Evidence assembly (evidence package)
    ↓
Context Package assembly (retrieval/context-package/)
    ↓
Executive Context Package (runtime integration boundary)
    ↓
LLM invocation (ChatGPT reasons over supplied context)
    ↓
Runtime validation and artifact capture
```

### Distinction from Retrieval Context Package

| Artifact | Layer | Consumer |
|----------|-------|----------|
| Context Package (assembled) | Retrieval (DOC-005) | Inference orchestration |
| Executive Context Package | Runtime Integration (this document) | LLM (ChatGPT) |

The Retrieval Context Package is the architectural artifact defined in Retrieval Architecture — assembled evidence organized by tier for inference. The Executive Context Package is the **runtime integration boundary artifact** that extends the assembled context with governance constraints, confidence indicators, and executive continuity data before LLM invocation. The Runtime Engine produces the Executive Context Package by composing retrieval output with memory, governance, and continuity context.

See also: `context/docs/context-packages.md`, `retrieval/docs/context-package-assembly.md`.

---

## 8. LLM Responsibilities

The underlying LLM (currently ChatGPT) is responsible for capabilities that ApexOS intentionally leverages rather than recreates:

| Capability | Description |
|------------|-------------|
| Natural language understanding | Interpreting executive intent from conversational input |
| Conversation | Maintaining dialogue flow across turns and topics |
| Synthesis | Integrating Runtime-supplied context into coherent guidance |
| Explanation | Articulating reasoning, tradeoffs, and recommendations |
| Writing | Producing executive-facing language |
| Reasoning over supplied context | Applying native reasoning to the Executive Context Package |
| Communication | Clarifying, following up, and maintaining conversational continuity |

ApexOS intentionally leverages improvements in foundation models. As models improve at language, synthesis, and reasoning, the executive experience improves without Runtime Engine changes to core orchestration logic.

---

## 9. Future MCP Integration

The Runtime Engine is designed for **Model Context Protocol (MCP)** integration as a future interface mechanism.

| Integration Point | Direction | Purpose |
|-------------------|-----------|---------|
| ChatGPT → Runtime Engine | MCP client → MCP server | ChatGPT invokes Runtime capabilities via MCP tools |
| Runtime Engine → Supabase | Internal service calls | Persistent artifact read/write |
| Runtime Engine → Knowledge Repository | Internal retrieval | Evidence and doctrine access |
| Custom UI → Runtime Engine | API or MCP | Alternative executive interfaces |

MCP integration preserves the separation of concerns defined in this document: the interface layer (ChatGPT, Claude, Gemini, custom UI) invokes Runtime Engine capabilities without embedding executive intelligence in the interface.

**Status:** Future implementation. This document establishes the architectural boundary; MCP tool definitions and server implementation are Build 11B+ scope.

---

## 10. Runtime Portability

The Runtime Engine must remain **independent of any single foundation model or interface**.

| Principle | Application |
|-----------|-------------|
| Interface abstraction | ChatGPT, Claude, Gemini, custom UI, and API consumers invoke the same Runtime Engine |
| Model-agnostic context | Executive Context Package format does not assume a specific LLM provider |
| Orchestration stability | Pipeline orchestration logic does not change when the interface or model changes |
| Storage portability | Supabase uses standard Postgres — migration to alternative stores remains feasible |

Future interfaces may include ChatGPT, Claude, Gemini, custom UI, and API consumers without changing Runtime behavior.

---

## 11. Commercialization Implications

The Runtime Integration Architecture supports commercialization by separating **interface** from **intelligence engine**:

| Dimension | Implication |
|-----------|-------------|
| **Product surface** | ChatGPT (or equivalent) provides the executive-facing product experience |
| **Core IP** | ApexOS Runtime Engine — executive memory, governance, evidence assembly, learning |
| **Data moat** | Executive memory, validated patterns, outcome history, and organizational context accumulate per executive |
| **Platform independence** | Runtime Engine is not locked to OpenAI, Anthropic, Google, or any single provider |
| **Enterprise deployment** | Runtime Engine deployable behind enterprise-chosen interfaces and models |
| **Knowledge expansion** | Knowledge Repository grows independently of interface or model selection |

Commercialization does not require ApexOS to compete with foundation models. ApexOS competes on executive-specific intelligence that foundation models cannot replicate without persistent memory, governance, outcome validation, and learning.

---

## 12. Implementation Principles

These principles govern Runtime Integration implementation. They clarify orchestration without modifying conceptual architecture.

### Conversation is not intelligence

ChatGPT provides the conversation experience. ApexOS provides executive intelligence. The executive experiences one continuous conversation; the Runtime Engine operates invisibly behind it.

### Context precedes reasoning

The Runtime Engine prepares executive context before LLM reasoning begins. The LLM does not retrieve evidence, enforce doctrine, or assemble memory — it reasons over what the Runtime Engine supplies.

### Reasoning is orchestrated, not duplicated

ApexOS orchestrates the reasoning pipeline (Context → Retrieval → Evidence → Inference → Recommendation) rather than replacing modern LLM reasoning. The Runtime Engine produces structured artifacts and context; the LLM synthesizes and communicates.

### Doctrine governs orchestration

All Runtime behavior remains governed by ApexOS doctrine and architecture. Implementation may support architecture; implementation may not redefine architecture (LAD-002).

### Portability is preserved

The Runtime Engine must remain independent of any single foundation model or interface. Interface changes do not require Runtime Engine redesign.

### Evidence precedes inference

The Runtime Engine assembles evidence before LLM reasoning. The LLM does not select evidence or override retrieval governance.

### Recommendations do not equal decisions

The Runtime Engine orchestrates recommendations; the executive retains full agency. ChatGPT communicates recommendations; the executive decides.

### Transparency is always available

Executive Glass Box provides full provenance when requested. The pipeline is invisible by default but traceable on demand.

---

## 13. Relationship to Existing Architecture

This document does **not** modify any conceptual architecture document. The following remain authoritative and correct:

| Document | ID | Status |
|----------|----|--------|
| Project Charter v1.0 | DOC-001 | Unchanged |
| Foundations Architecture v1.0 | DOC-002 | Unchanged |
| Memory Architecture v1.0 | DOC-003 | Unchanged |
| Context Architecture v1.0 | DOC-004 | Unchanged |
| Retrieval Architecture v1.0 | DOC-005 | Unchanged |
| Governance Architecture v1.0 | DOC-006 | Unchanged |
| Inference Architecture v1.0 | DOC-007 | Unchanged |
| Recommendation Architecture v1.0 | DOC-008 | Unchanged |
| Outcome & Results Architecture v1.0 | DOC-009 | Unchanged |

This document clarifies **how** these layers are orchestrated during implementation when ChatGPT serves as the executive interface and the Runtime Engine serves as the intelligence engine.

### Related Implementation Documents

| Document | Relationship |
|----------|--------------|
| `docs/product/Executive Experience Design v1.0.md` | Product experience specification — subordinate to this technical clarification |
| `apps/executive-ui/docs/RUNTIME-FLOW.md` | Build 10 runtime flow — validated pipeline execution |
| `build/build-11-executive-conversation-interface.md` | Build 11 conversation adapter — thin interface layer |
| `supabase/IMPLEMENTATION-GUIDE.md` | Supabase persistence layer |
| `knowledge/REPOSITORY-GUIDE.md` | Knowledge Repository organization |
| `TRACEABILITY.md` | Cross-layer traceability requirements |

---

## 14. Build 11B Scope Boundary

This document is an **implementation clarification**. Build 11B does not include:

- Code generation
- API definitions
- SQL or schema changes
- MCP server implementation
- ChatGPT integration code

Build 11B establishes the architectural boundary and responsibility model for subsequent integration builds.
