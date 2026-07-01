/** Memory artifact retrieved from Supabase for context assembly. */
export interface MemoryItem {
  externalId: string;
  category: string;
  title: string;
  summary: string;
  confidence?: string;
  bodyMd?: string;
  repositoryPath?: string;
}

/** Context relevance specification from context layer. */
export interface ContextRelevanceData {
  externalId: string;
  title: string;
  situationSummary: string;
  domainWeights: Record<string, string>;
  weightingRationale: string;
  retrievalTiers: Record<string, unknown>;
  bodyMd?: string;
}

/** Evidence package assembled by retrieval layer. */
export interface EvidenceAssembly {
  evidencePackage: {
    externalId: string;
    title: string;
    assemblyTiers: Record<string, unknown>;
    gaps: unknown[];
    bodyMd?: string;
  } | null;
  contradictoryEvidence: Array<{
    externalId: string;
    title: string;
    summary: string;
    bodyMd?: string;
  }>;
  assembledContextPackage: {
    externalId: string;
    title: string;
    assemblyTiers: Record<string, unknown>;
    bodyMd?: string;
  } | null;
  retrievalRequest: {
    externalId: string;
    title: string;
    scopeSummary: string;
  } | null;
}

/** Governance constraints applied before LLM invocation. */
export interface GovernanceConstraints {
  doctrineReferences: string[];
  fidelityRules: string[];
  traceabilityRequired: boolean;
  driftProtection: string[];
  validationResults: GovernanceCheck[];
}

export interface GovernanceCheck {
  check: string;
  passed: boolean;
  detail?: string;
}

/** Confidence indicators from retrieval and inference artifacts. */
export interface ConfidenceIndicators {
  retrievalConfidence: string;
  evidenceGaps: string[];
  uncertaintyFlags: string[];
  assumptions: string[];
}

/** Doctrine reference from knowledge repository. */
export interface DoctrineReference {
  title: string;
  source: string;
  summary: string;
}

/**
 * Executive Context Package — runtime integration boundary artifact.
 * Extends assembled retrieval context with governance, memory, and continuity.
 * @see TECH-002 Section 7
 */
export interface ExecutiveContextPackage {
  version: "1.0";
  assembledAt: string;
  requestId: string;
  executive: {
    slug: string;
    displayName: string;
    summary?: string;
  };
  situation: {
    slug: string;
    title: string;
    summary?: string;
    situationType?: string;
  } | null;
  executiveMessage: string;
  memory: {
    executive: MemoryItem[];
    person: MemoryItem[];
    relationship: MemoryItem[];
    pattern: MemoryItem[];
    outcomes: MemoryItem[];
    observations: MemoryItem[];
  };
  contextRelevance: ContextRelevanceData | null;
  evidence: EvidenceAssembly;
  governance: GovernanceConstraints;
  confidence: ConfidenceIndicators;
  doctrine: DoctrineReference[];
  /** Serialized context for LLM instructions — not executive reasoning. */
  llmInstructions: string;
}
