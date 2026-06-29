# Build 10A — Product Experience Recommendations

**Date:** 2026-06-29  
**Perspective:** ApexOS as an executive product, not software  
**Goal:** Reduce cognitive load while increasing trust

---

## Executive Workflow

### Current State (After Build 10A)

The executive can:
1. View recent activity on Executive Home
2. Open a situation and see pipeline status + observability metrics
3. Inspect the full reasoning pipeline in Glass Box
4. Drill into Evidence, Reasoning, Decision, and Outcome views
5. Capture decisions and outcomes

### Recommendations

| Recommendation | Rationale | Priority |
|----------------|-----------|----------|
| **Default landing on active situation** | Executives think in situations, not lists. Home could highlight the most recent active situation with a direct Glass Box link. | Medium |
| **Decision-first flow for pending recommendations** | When a recommendation is delivered but no decision recorded, surface a prominent "Decision Required" banner on overview. | High |
| **Outcome follow-up reminders** | Pending follow-ups exist on Home but lack situation links. Link each to its situation workspace. | Medium |
| **Single-page executive brief** | Optional condensed view: Situation + Recommendation + Key Evidence + Decision Required — for executives who won't navigate tabs. | Low |

---

## Clarity

| Area | Current | Recommendation |
|------|---------|----------------|
| Confidence display | "medium" text | Add plain-language interpretation: "Moderate confidence — evidence consistent but gaps remain" |
| External IDs | Shown everywhere (SIT-001, REC-PKG-001) | Keep for traceability but secondary to human titles |
| Pipeline stage names | Technical (Inference, Retrieval) | Glass Box uses same terms — add one-line tooltips explaining each stage's purpose |
| Uncertainty flags | Raw snake_case (`equally_viable_options`) | **Done in 10A** — displayed as readable labels |

---

## Confidence

| Mechanism | Status | Next Step |
|-----------|--------|-----------|
| Confidence summary on recommendation | Present | Surface on Home and overview prominently |
| Uncertainty flags visible | **Done in 10A** | Consider color-coded severity |
| Contradictory evidence count | **Done in 10A** | Link directly to contradictory evidence section |
| Assumption register | In Reasoning viewer | Surface assumption count with link from Glass Box Interpretation stage |
| Transformation log | **Done in 10A** | Builds audit trust — keep visible but collapsed by default |

---

## Evidence Exploration

| Recommendation | Impact |
|----------------|--------|
| Evidence tier badges (critical/supporting/available) | Already shown — make tier meaning explicit in UI |
| "Why was this retrieved?" on each evidence card | Link evidence items back to retrieval scope |
| Contradictory evidence prominence | When contradictions exist, show warning indicator on overview |
| Source document links | Show `repository_path` as clickable reference to artifact origin |

---

## Reasoning Visualization

| Build 10A Delivery | Future Enhancement |
|--------------------|------------------|
| Glass Box linear pipeline | Optional graph view for complex multi-branch scenarios |
| Expandable stages with Q&A | Stage comparison (before/after context refresh) |
| Component artifacts nested | Inline doctrine citation with source excerpt |
| Deep links to Evidence/Reasoning | Bidirectional navigation (Evidence → Glass Box stage) |

---

## Recommendation Presentation

| Current | Recommendation |
|---------|----------------|
| Full markdown body on overview | Lead with recommendation summary sentence; expand for detail |
| Options in separate component artifact | Surface Option A/B/C comparison table on overview |
| Doctrine influence buried in components | Dedicated "Doctrine" subsection in Glass Box Recommendation stage |

---

## Learning Visibility

| Current | Recommendation |
|---------|----------------|
| Learning stage in Glass Box | Good — shows validated learning and promotion status |
| No memory promotion UI | Show "Pending promotion" with link to memory workflow docs |
| Outcome → Learning chain visible | Add "What changed because of this decision?" summary on outcome page |

---

## Decision Traceability

| Build 10A Delivery | Assessment |
|--------------------|------------|
| Full pipeline Situation → Learning | Meets Glass Box objective |
| External decision reference preserved | Doctrine-compliant (decisions ≠ recommendations) |
| Transformation log per stage | Supports "what changed and when" |
| Traceability chain on overview | Technical — Glass Box is the executive-facing version |

---

## Cognitive Load Summary

**Reduce:**
- Tab switching for understanding "why" → Glass Box consolidates provenance
- Hunting for confidence/uncertainty → Observability bar surfaces key metrics
- Interpreting external IDs → Summaries lead, IDs follow

**Increase:**
- Visible evidence counts and contradiction alerts
- Expandable detail on demand (progressive disclosure)
- Plain-language explainability Q&A per stage

---

## Priority Matrix

| Priority | Item | Build |
|----------|------|-------|
| P0 | Glass Box provenance pipeline | **10A — Done** |
| P0 | Runtime observability bar | **10A — Done** |
| P1 | Decision Required banner | 11 |
| P1 | Home → situation deep links for follow-ups | 11 |
| P2 | Executive brief single-page view | 11+ |
| P2 | Confidence plain-language labels | 11 |
| P3 | Provenance graph visualization | Future |

Build 10A delivers the foundational trust layer. Subsequent builds should focus on workflow acceleration and plain-language executive communication.
