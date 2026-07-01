# Runtime Module Specifications

Concise, implementation-focused specifications for each runtime module.

---

## Orchestrator (`pipeline/orchestrator.ts`)

| | |
|---|---|
| **Purpose** | Coordinates pipeline stage execution in sequence |
| **Responsibilities** | Initialize context, invoke stages, handle errors, build response |
| **Inputs** | `ExecutiveRequest` |
| **Outputs** | `RuntimeResponse` or `PipelineContext` (dry mode) |
| **Dependencies** | All pipeline stages |
| **Constraints** | Stages execute sequentially; no stage skipping except documented skips |

---

## Runtime Entry (`pipeline/stages/runtime-entry.ts`)

| | |
|---|---|
| **Purpose** | Validate and normalize incoming executive requests |
| **Responsibilities** | Validate message, resolve executive, resolve situation, assign request ID |
| **Inputs** | `ExecutiveRequest` |
| **Outputs** | `ValidatedRequest`, populated `executive` and `situation` on context |
| **Dependencies** | Supabase (`executives`, `situations`), config |
| **Constraints** | Message required; executive must exist in database |

---

## Memory Retrieval (`pipeline/stages/memory-retrieval.ts`)

| | |
|---|---|
| **Purpose** | Load executive memory relevant to the current request |
| **Responsibilities** | Query memory_artifacts by category; load situation observations |
| **Inputs** | `PipelineContext` with executive and optional situation |
| **Outputs** | `MemoryRetrievalResult` on context |
| **Dependencies** | Supabase (`memory_artifacts`, `observations`) |
| **Constraints** | Read-only; no memory promotion or mutation |

---

## Context Retrieval (`pipeline/stages/context-retrieval.ts`)

| | |
|---|---|
| **Purpose** | Load context relevance specification for the situation |
| **Responsibilities** | Query context_relevance_specs by situation ID or repository path |
| **Inputs** | `PipelineContext` with situation |
| **Outputs** | `ContextRelevanceData` on context |
| **Dependencies** | Supabase (`context_relevance_specs`) |
| **Constraints** | Skipped when no situation; does not perform context evaluation |

---

## Evidence Assembly (`pipeline/stages/evidence-assembly.ts`)

| | |
|---|---|
| **Purpose** | Load evidence packages and assembled context from retrieval layer |
| **Responsibilities** | Traverse retrieval_requests → evidence_packages → assembled_context_packages |
| **Inputs** | `PipelineContext` with contextRelevance |
| **Outputs** | `EvidenceAssembly` on context |
| **Dependencies** | Supabase (retrieval tables) |
| **Constraints** | Read-only; does not assemble new evidence (uses persisted artifacts) |

---

## Governance Validation (`pipeline/stages/governance-validation.ts`)

| | |
|---|---|
| **Purpose** | Enforce structural and fidelity checks before LLM invocation |
| **Responsibilities** | Run governance checklist; attach doctrine references and fidelity rules |
| **Inputs** | `PipelineContext` with memory, context, evidence |
| **Outputs** | `GovernanceConstraints` on context |
| **Dependencies** | None (in-memory validation) |
| **Constraints** | Structural checks only; full checklist execution deferred to Build 14+ |

---

## Context Package Builder (`pipeline/stages/context-package-builder.ts`)

| | |
|---|---|
| **Purpose** | Assemble the Executive Context Package (TECH-002 Section 7) |
| **Responsibilities** | Compose memory, context, evidence, governance into LLM instructions |
| **Inputs** | Full `PipelineContext` through governance stage |
| **Outputs** | `ExecutiveContextPackage` on context |
| **Dependencies** | All prior stages |
| **Constraints** | Assembly only — no executive reasoning |

---

## LLM Invocation (`pipeline/stages/llm-invocation.ts`)

| | |
|---|---|
| **Purpose** | Delegate reasoning to the configured LLM provider |
| **Responsibilities** | Pass instructions + input to provider; capture response |
| **Inputs** | `ExecutiveContextPackage`, executive message |
| **Outputs** | `LLMResponse` on context |
| **Dependencies** | LLM provider abstraction |
| **Constraints** | Runtime does not modify LLM reasoning |

---

## Response Processing (`pipeline/stages/response-processing.ts`)

| | |
|---|---|
| **Purpose** | Normalize LLM output into RuntimeResponse |
| **Responsibilities** | Build response object with metadata and stage trace |
| **Inputs** | Complete `PipelineContext` |
| **Outputs** | `RuntimeResponse` |
| **Dependencies** | LLM response |
| **Constraints** | No content modification |

---

## Interaction Capture (`pipeline/stages/interaction-capture.ts`)

| | |
|---|---|
| **Purpose** | Persist executive request and runtime response |
| **Responsibilities** | Create/update conversation; insert messages with metadata |
| **Inputs** | Complete `PipelineContext` |
| **Outputs** | `interactionId` on context |
| **Dependencies** | Supabase (`executive_conversations`, `conversation_messages`) |
| **Constraints** | Uses existing Build 11 schema; capture failure is non-fatal |

---

## LLM Provider Abstraction (`providers/llm/`)

| | |
|---|---|
| **Purpose** | Decouple runtime orchestration from any single foundation model |
| **Responsibilities** | Define provider interface; route to configured implementation |
| **Inputs** | `LLMRequest` (instructions, input, previousResponseId) |
| **Outputs** | `LLMResponse` (text, responseId, model, usage) |
| **Dependencies** | Config |
| **Constraints** | Provider swap must not require orchestration changes |

### OpenAI Provider (`openai-provider.ts`)

Uses OpenAI Responses API (`POST /v1/responses`). Supports `instructions`, `input`, and `previous_response_id` for multi-turn continuity.

### Stub Provider (`stub-provider.ts`)

Returns structured preview for dry-run mode. Used when `APEXOS_RUNTIME_DRY_RUN=true` or no API key configured.

---

## HTTP Server (`server/http-server.ts`)

| | |
|---|---|
| **Purpose** | Expose runtime pipeline as REST endpoints |
| **Responsibilities** | Route requests, parse JSON, invoke orchestrator, return responses |
| **Inputs** | HTTP POST with `ExecutiveRequest` JSON body |
| **Outputs** | JSON `RuntimeResponse` or error |
| **Dependencies** | Orchestrator |
| **Constraints** | Service role key server-side only; 1MB body limit |

---

## Configuration (`config.ts`)

| | |
|---|---|
| **Purpose** | Load and expose runtime environment configuration |
| **Responsibilities** | Load `.env.local` from repo root; provide typed config |
| **Inputs** | Environment variables |
| **Outputs** | `runtimeConfig` object |
| **Dependencies** | dotenv |
| **Constraints** | Follows existing ApexOS env conventions |

---

## Supabase Client (`shared/supabase.ts`)

| | |
|---|---|
| **Purpose** | Singleton Supabase client for runtime data access |
| **Responsibilities** | Create service-role client; no session persistence |
| **Inputs** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Outputs** | `SupabaseClient` |
| **Dependencies** | @supabase/supabase-js |
| **Constraints** | Service role only; never exposed to interface layer |
